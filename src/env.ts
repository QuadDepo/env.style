import { parseHex } from "./color";

export interface EnvStylesOptions {
	/** Kill switch for the whole tool. Default true. */
	enabled?: boolean;
	/** Per-environment tint color override, e.g. { staging: '#ff00ff' }. */
	color?: Partial<Record<string, string>>;
	/** Force the environment instead of detecting it. */
	environment?: string;
	/** Keep pixels near these colors untinted. */
	excludeColors?: string[];
	/**
	 * Path to a ready-made icon, relative to the project root (absolute also allowed),
	 * or a per-environment map of paths, e.g. { staging: 'staging-icon.png' }. Served
	 * as-is for styled envs — tinting and excludeColors are skipped entirely. A missing
	 * env in the map falls back to normal tinting.
	 */
	icon?: string | Partial<Record<string, string>>;
}

export const DEFAULT_COLORS: Record<string, string> = {
	development: "#3b82f6",
	preview: "#f59e0b",
};
export const FALLBACK_COLOR = "#6b7280";

export function detectEnv(
	override: string | undefined,
	frameworkDefault: () => string,
): string {
	const env = typeof process === "undefined" ? undefined : process.env;
	return (
		override ??
		env?.ENV_STYLES_ENV ??
		env?.VERCEL_TARGET_ENV ??
		env?.VERCEL_ENV ??
		frameworkDefault()
	);
}

/** Fail loudly on a bad config value, not mid-build. */
export function validateColorOptions(options: EnvStylesOptions): void {
	for (const value of Object.values(options.color ?? {})) {
		if (value !== undefined) parseHex(value);
	}
	for (const value of options.excludeColors ?? []) parseHex(value);
}

export function resolveColor(
	env: string,
	overrides: EnvStylesOptions["color"],
): string {
	return overrides?.[env] ?? DEFAULT_COLORS[env] ?? FALLBACK_COLOR;
}

export function resolveIcon(
	env: string,
	icon: EnvStylesOptions["icon"],
): string | undefined {
	return typeof icon === "string" ? icon : icon?.[env];
}
