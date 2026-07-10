import { parseHex } from "./color";
import { DEFAULT_COLOR_OPACITY } from "./constants";

export interface EnvStylesOptions {
	/** Kill switch for the whole tool. Default true. */
	enabled?: boolean;
	/** Per-environment tint color override, e.g. { staging: '#ff00ff' }. */
	color?: Partial<Record<string, string>>;
	/** Force the environment instead of detecting it. */
	environment?: string;
	/** Keep pixels near these colors untinted. */
	excludeColors?: string[];
	/** Opacity for the env color blend, from 0 (original icon) to 1 (solid env color). Default 0.75. */
	colorOpacity?: number;
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
		// Vercel (already standard: production, preview, development)
		env?.VERCEL_TARGET_ENV ??
		env?.VERCEL_ENV ??
		// Netlify
		normalizeNetlify(env?.CONTEXT) ??
		// Cloudflare Pages
		env?.CLOUDFLARE_ENV ??
		// Railway
		normalizeRailway(env?.RAILWAY_ENVIRONMENT) ??
		// Render
		normalizeRender(env?.RENDER) ??
		// Deno Deploy
		normalizeDenoDeploy(env?.DENO_DEPLOY) ??
		// Fly.io (user-defined, no normalization)
		env?.FLY_ENV ??
		// Heroku
		normalizeHeroku(env?.DYNO) ??
		// Coolify (branch name, no normalization)
		env?.COOLIFY_BRANCH ??
		// Zerops (user-defined, no normalization)
		env?.ZEROPS_ENV ??
		// Sevalla (user-defined, no normalization)
		env?.SEVALLA_ENV ??
		// DigitalOcean App Platform (user-defined, no normalization)
		env?.DO_ENV ??
		frameworkDefault()
	);
}

function normalizeNetlify(context: string | undefined): string | undefined {
	if (!context) return undefined;
	if (context === "deploy-preview") return "preview";
	if (context === "branch-deploy" || context === "dev") return "development";
	return undefined;
}

function normalizeRailway(envName: string | undefined): string | undefined {
	if (!envName) return undefined;
	if (envName === "staging") return "staging";
	if (envName.startsWith("pr-")) return "preview";
	return undefined;
}

function normalizeRender(render: string | undefined): string | undefined {
	return render ? "preview" : undefined;
}

function normalizeDenoDeploy(deploy: string | undefined): string | undefined {
	return deploy ? "preview" : undefined;
}

function normalizeHeroku(dyno: string | undefined): string | undefined {
	return dyno ? "preview" : undefined;
}

export function assertColorOpacity(colorOpacity: number): void {
	if (!Number.isFinite(colorOpacity) || colorOpacity < 0 || colorOpacity > 1) {
		throw new Error("env.style: colorOpacity must be between 0 and 1");
	}
}

/** Fail loudly on a bad config value, not mid-build. */
export function validateColorOptions(options: EnvStylesOptions): void {
	for (const value of Object.values(options.color ?? {})) {
		if (value !== undefined) parseHex(value);
	}
	for (const value of options.excludeColors ?? []) parseHex(value);
	if (options.colorOpacity !== undefined)
		assertColorOpacity(options.colorOpacity);
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

export function resolveColorOpacity(options: EnvStylesOptions): number {
	return options.colorOpacity ?? DEFAULT_COLOR_OPACITY;
}
