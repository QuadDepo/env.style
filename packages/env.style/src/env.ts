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
	/**
	 * Generate multi-size icons (192x192, 512x512) for PWA manifests.
	 * Also rewrites manifest.json/manifest.webmanifest icon URLs. Default true.
	 */
	pwa?: boolean;
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
		// Render: RENDER identifies the platform; IS_PULL_REQUEST identifies previews.
		normalizeRender(env?.RENDER, env?.IS_PULL_REQUEST) ??
		// Deno Deploy
		normalizeDenoDeploy(env?.DENO_DEPLOY, env?.DENO_TIMELINE) ??
		// Fly.io (user-defined, no normalization)
		env?.FLY_ENV ??
		// Heroku: DYNO identifies the platform; HEROKU_PR_NUMBER identifies previews.
		normalizeHeroku(env?.DYNO, env?.HEROKU_PR_NUMBER) ??
		// Coolify exposes only the source branch, which cannot identify production
		// without knowing the resource's configured production branch. Users can set
		// ENV_STYLES_ENV explicitly for Coolify preview/staging environments.
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
	if (context === "production") return "production";
	if (context === "deploy-preview") return "preview";
	if (context === "branch-deploy" || context === "dev") return "development";
	return undefined;
}

function normalizeRailway(envName: string | undefined): string | undefined {
	if (!envName) return undefined;
	if (envName.startsWith("pr-")) return "preview";
	return envName;
}

function normalizeRender(
	render: string | undefined,
	isPullRequest: string | undefined,
): string | undefined {
	if (render !== "true") return undefined;
	return isPullRequest === "true" ? "preview" : "production";
}

function normalizeDenoDeploy(
	deploy: string | undefined,
	timeline: string | undefined,
): string | undefined {
	if (deploy !== "true") return undefined;
	if (timeline === "production") return "production";
	if (timeline?.startsWith("preview/")) return "preview";
	if (timeline?.startsWith("git-branch/")) return "development";
	return undefined;
}

function normalizeHeroku(
	dyno: string | undefined,
	pullRequestNumber: string | undefined,
): string | undefined {
	if (!dyno) return undefined;
	return pullRequestNumber ? "preview" : "production";
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
