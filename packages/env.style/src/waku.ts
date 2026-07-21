import { createElement, Fragment, type ReactElement } from "react";
import { TINTED_ICON_192_URL, TINTED_ICON_URL } from "./constants";
import { detectEnv, type EnvStylesOptions } from "./env";
import { envStyle as viteEnvStyle } from "./vite";

export type { EnvStylesOptions } from "./env";

declare global {
	var __ENV_STYLE_FAVICON_ACTIVE__: boolean | undefined;
	var __ENV_STYLE_PWA_ACTIVE__: boolean | undefined;
}

/**
 * Waku-facing wrapper around the Vite plugin. Its intentionally structural
 * return type avoids coupling Waku's bundled Vite patch version to the Vite
 * version used to build env.style.
 */
export function envStyle(options: EnvStylesOptions = {}): { name: string } {
	return viteEnvStyle(options);
}

/**
 * Waku metadata component for the root layout. Waku hoists the returned link
 * elements into the document head. Configuration lives on the envStyle Vite
 * plugin, whose build-time defines keep the RSC output in sync with the assets.
 */
export function EnvStyle(): ReactElement | null {
	const active = globalThis.__ENV_STYLE_FAVICON_ACTIVE__ ?? runtimeActive();
	if (!active) return null;

	const links = [
		createElement("link", {
			key: "icon",
			rel: "icon",
			href: TINTED_ICON_URL,
		}),
	];
	if (globalThis.__ENV_STYLE_PWA_ACTIVE__ ?? true) {
		links.push(
			createElement("link", {
				key: "apple-touch-icon",
				rel: "apple-touch-icon",
				href: TINTED_ICON_192_URL,
			}),
		);
	}
	return createElement(Fragment, null, ...links);
}

function runtimeActive(): boolean {
	return detectEnv(undefined, defaultRuntimeEnv) !== "production";
}

function defaultRuntimeEnv(): string {
	const isDev =
		typeof process !== "undefined" && process.env?.NODE_ENV === "development";
	return isDev ? "development" : "production";
}
