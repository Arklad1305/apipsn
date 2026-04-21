export type { Platform, ProviderSource, RawDeal, RegionConfig } from "./types";
export { PLATFORM_LABELS, PLATFORM_REGIONS, ProviderError } from "./types";

import type { Platform, Provider } from "./types";
import { psnProvider } from "./psn";
import { xboxProvider } from "./xbox";
import { steamProvider } from "./steam";
import { nintendoProvider } from "./nintendo";

const PROVIDERS: Record<Platform, Provider> = {
  psn: psnProvider,
  xbox: xboxProvider,
  steam: steamProvider,
  nintendo: nintendoProvider,
};

export function getProvider(platform: Platform): Provider {
  return PROVIDERS[platform];
}

export function allProviders(): Provider[] {
  return Object.values(PROVIDERS);
}
