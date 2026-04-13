"""
Persisted GraphQL operations used by the PlayStation Store web client.

The PSN web store calls a single endpoint with an APQ-style persisted query:
  GET https://web.np.playstation.com/api/graphql/v1/op
      ?operationName=<name>
      &variables=<json>
      &extensions=<json-with-persistedQuery.sha256Hash>

The SHA256 hash occasionally changes when PSN ships a new version of the site.
When that happens the API returns {"errors":[{"extensions":{"code":"PERSISTED_QUERY_NOT_FOUND"}}]}.
To recover, open DevTools > Network on the PS Store page, find the XHR to
/api/graphql/v1/op?operationName=<name>, and copy the `sha256Hash`.
"""

from __future__ import annotations

# Operation names used by the store.
CATEGORY_GRID_OP = "categoryGridRetrieve"

# Default variables. `id` is the category UUID; pageArgs controls pagination.
DEFAULT_PAGE_SIZE = 100


def build_variables(category_id: str, size: int, offset: int) -> dict:
    return {
        "id": category_id,
        "pageArgs": {"size": size, "offset": offset},
        "sortBy": None,
        "filterBy": [],
        "facetOptions": [],
    }


def build_extensions(sha256_hash: str) -> dict:
    return {
        "persistedQuery": {
            "version": 1,
            "sha256Hash": sha256_hash,
        }
    }
