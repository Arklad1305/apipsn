import {
  iterCategoryProducts,
  isFullGameProduct,
  normalizeProduct,
  PsnApiError,
} from "../psn";
import type { PsnConfig } from "../store";
import type { Provider, ProviderSource, RawDeal } from "./types";

export const psnProvider: Provider = {
  platform: "psn",
  async *fetchDeals(source: ProviderSource): AsyncGenerator<RawDeal> {
    const locale =
      source.region === "br" ? "pt-BR" : "en-US";
    const cfg: PsnConfig = {
      region: locale,
      dealsCategoryId: source.categoryId || "",
      categoryGridHash: "",
      includeAddOns: false,
    };

    if (!cfg.dealsCategoryId) {
      throw new PsnApiError(
        "No se configuró un Category ID para PSN " + source.region.toUpperCase()
      );
    }

    const currency = source.region === "br" ? "BRL" : "USD";

    for await (const raw of iterCategoryProducts(cfg)) {
      if (!isFullGameProduct(raw)) continue;
      const now = new Date().toISOString();
      const game = normalizeProduct(raw, now);
      if (!game) continue;

      const regionPath = locale.toLowerCase();
      const storeUrl = `https://store.playstation.com/${regionPath}/product/${game.id}`;

      yield {
        id: game.id,
        name: game.name,
        imageUrl: game.imageUrl,
        bannerUrl: game.bannerUrl,
        storeUrl,
        hardwarePlatforms: game.platforms,
        currency,
        priceOriginalCents: game.priceOriginalCents,
        priceDiscountedCents: game.priceDiscountedCents,
        discountPercent: game.discountPercent,
        discountEndAt: game.discountEndAt,
      };
    }
  },
};
