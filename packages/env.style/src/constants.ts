export const OUT_DIR = "__envstyle";
export const DEFAULT_COLOR_OPACITY = 0.75;
/** Where writeTintedIcon's output is served from, relative to the site root. */
export const TINTED_ICON_URL = `/${OUT_DIR}/icon.png`;
export const TINTED_ICON_192_URL = `/${OUT_DIR}/icon-192.png`;
export const TINTED_ICON_512_URL = `/${OUT_DIR}/icon-512.png`;
/** Sizes for multi-size icon generation (favicon + PWA). */
export const ICON_SIZES = [64, 192, 512] as const;
export type IconSize = (typeof ICON_SIZES)[number];
