import { TINTED_ICON_URL } from "./constants";
import { detectEnv } from "./env";

export type EnvStyleLink = {
	rel: "icon";
	href: string;
};

declare global {
	var __ENV_STYLE_FAVICON_ACTIVE__: boolean | undefined;
}

/**
 * Favicon links for a TanStack Start route `head()`. Takes no options:
 * configuration lives on the Vite plugin, whose build-time define wins here so
 * server and client bundles can't disagree. Runtime detection only runs when
 * this module loads outside Vite-processed code.
 */
export function envStyleLinks(): EnvStyleLink[] {
	const active = globalThis.__ENV_STYLE_FAVICON_ACTIVE__ ?? runtimeActive();
	return active ? [{ rel: "icon", href: TINTED_ICON_URL }] : [];
}

function runtimeActive(): boolean {
	return detectEnv(undefined, defaultRuntimeEnv) !== "production";
}

function defaultRuntimeEnv(): string {
	const isDev =
		typeof process !== "undefined" && process.env?.NODE_ENV === "development";
	return isDev ? "development" : "production";
}
