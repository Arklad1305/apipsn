"""
Thin client for the PSN Store GraphQL endpoint (persisted queries).
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass

import httpx

from .queries import (
    CATEGORY_GRID_OP,
    DEFAULT_PAGE_SIZE,
    build_extensions,
    build_variables,
)

PSN_GRAPHQL_URL = "https://web.np.playstation.com/api/graphql/v1/op"

# A real desktop UA avoids some edge cases where PSN returns an empty body.
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


class PSNApiError(RuntimeError):
    """Raised when the PSN API returns a GraphQL-level error."""


class PersistedQueryNotFound(PSNApiError):
    """The configured sha256Hash is stale and must be updated."""


@dataclass
class PSNRawProduct:
    raw: dict  # full product dict, as returned by PSN


class PSNClient:
    def __init__(
        self,
        region: str,
        category_grid_hash: str,
        timeout: float = 20.0,
    ) -> None:
        self.region = region
        self.category_grid_hash = category_grid_hash
        self._client = httpx.AsyncClient(
            timeout=timeout,
            headers={
                "User-Agent": DEFAULT_USER_AGENT,
                "Accept": "application/json",
                "x-psn-store-locale-override": region,
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "PSNClient":
        return self

    async def __aexit__(self, *exc) -> None:
        await self.aclose()

    async def _request(
        self, operation_name: str, variables: dict, sha256_hash: str
    ) -> dict:
        params = {
            "operationName": operation_name,
            "variables": json.dumps(variables, separators=(",", ":")),
            "extensions": json.dumps(
                build_extensions(sha256_hash), separators=(",", ":")
            ),
        }
        # Retry with exponential backoff on transient failures.
        last_exc: Exception | None = None
        for attempt in range(4):
            try:
                r = await self._client.get(PSN_GRAPHQL_URL, params=params)
                if r.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"PSN {r.status_code}", request=r.request, response=r
                    )
                data = r.json()
                break
            except (httpx.HTTPError, json.JSONDecodeError) as exc:
                last_exc = exc
                await asyncio.sleep(2**attempt)
        else:
            raise PSNApiError(f"PSN request failed: {last_exc}") from last_exc

        if "errors" in data and data["errors"]:
            err = data["errors"][0]
            code = (err.get("extensions") or {}).get("code", "")
            if "PERSISTED_QUERY_NOT_FOUND" in code.upper():
                raise PersistedQueryNotFound(
                    "PSN persisted query hash is stale. Update PSN_CATEGORY_GRID_HASH."
                )
            raise PSNApiError(f"PSN GraphQL error: {err}")
        return data.get("data") or {}

    async def fetch_category_page(
        self, category_id: str, size: int, offset: int
    ) -> dict:
        variables = build_variables(category_id, size, offset)
        return await self._request(
            CATEGORY_GRID_OP, variables, self.category_grid_hash
        )

    async def iter_category_products(
        self, category_id: str, page_size: int = DEFAULT_PAGE_SIZE
    ):
        """Async generator that yields raw product dicts from a category."""
        offset = 0
        total: int | None = None
        while True:
            data = await self.fetch_category_page(category_id, page_size, offset)
            grid = data.get("categoryGridRetrieve") or {}
            products = grid.get("products") or []
            if total is None:
                total = int(grid.get("totalCount") or 0)
            for p in products:
                if p:
                    yield PSNRawProduct(raw=p)
            offset += len(products)
            if not products or (total is not None and offset >= total):
                break
