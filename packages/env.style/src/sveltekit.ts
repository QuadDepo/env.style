import { TINTED_ICON_URL } from "./constants";
import { detectEnv } from "./env";

declare global {
	var __ENV_STYLE_FAVICON_ACTIVE__: boolean | undefined;
}

/**
 * Selects the generated favicon while env.style's Vite plugin is active,
 * otherwise preserving the app's existing favicon. Pass SvelteKit's `base`
 * as the second argument when the app is served from a base path.
 */
export function envStyleFavicon(fallback: string, base = ""): string {
	const active = globalThis.__ENV_STYLE_FAVICON_ACTIVE__ ?? runtimeActive();
	return active ? `${base}${TINTED_ICON_URL}` : fallback;
}

function runtimeActive(): boolean {
	return detectEnv(undefined, defaultRuntimeEnv) !== "production";
}

function defaultRuntimeEnv(): string {
	const isDev =
		typeof process !== "undefined" && process.env?.NODE_ENV === "development";
	return isDev ? "development" : "production";
}
