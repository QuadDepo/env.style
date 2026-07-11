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

export interface EnvironmentDiagnostics {
	environment: string;
	source: string;
	provider: string | null;
}

export type EnvironmentVariables = Record<string, string | undefined>;

export function detectEnv(
	override: string | undefined,
	frameworkDefault: () => string,
): string {
	return detectEnvDiagnostics(override, frameworkDefault).environment;
}

export function detectEnvDiagnostics(
	override: string | undefined,
	frameworkDefault: () => string,
	env: EnvironmentVariables = typeof process === "undefined" ? {} : process.env,
): EnvironmentDiagnostics {
	const candidates: Array<[string | undefined, string, string | null]> = [
		[override, "option:environment", null],
		[env.ENV_STYLES_ENV, "ENV_STYLES_ENV", null],
		// Vercel (already standard: production, preview, development)
		[env.VERCEL_TARGET_ENV, "VERCEL_TARGET_ENV", "vercel"],
		[env.VERCEL_ENV, "VERCEL_ENV", "vercel"],
		// Netlify
		[normalizeNetlify(env.CONTEXT), "CONTEXT", "netlify"],
		// Cloudflare Pages
		[env.CLOUDFLARE_ENV, "CLOUDFLARE_ENV", "cloudflare"],
		// Railway
		[
			normalizeRailway(env.RAILWAY_ENVIRONMENT),
			"RAILWAY_ENVIRONMENT",
			"railway",
		],
		// Render: RENDER identifies the platform; IS_PULL_REQUEST identifies previews.
		[
			normalizeRender(env.RENDER, env.IS_PULL_REQUEST),
			"IS_PULL_REQUEST",
			"render",
		],
		// Deno Deploy
		[
			normalizeDenoDeploy(env.DENO_DEPLOY, env.DENO_TIMELINE),
			"DENO_TIMELINE",
			"deno",
		],
		// Fly.io (user-defined, no normalization)
		[env.FLY_ENV, "FLY_ENV", "fly.io"],
		// Heroku: DYNO identifies the platform; HEROKU_PR_NUMBER identifies previews.
		[
			normalizeHeroku(env.DYNO, env.HEROKU_PR_NUMBER),
			env.HEROKU_PR_NUMBER ? "HEROKU_PR_NUMBER" : "DYNO",
			"heroku",
		],
		// Coolify exposes only the source branch, which cannot identify production
		// without knowing the resource's configured production branch. Users can set
		// ENV_STYLES_ENV explicitly for Coolify preview/staging environments.
		// Zerops (user-defined, no normalization)
		[env.ZEROPS_ENV, "ZEROPS_ENV", "zerops"],
		// Sevalla (user-defined, no normalization)
		[env.SEVALLA_ENV, "SEVALLA_ENV", "sevalla"],
		// DigitalOcean App Platform (user-defined, no normalization)
		[env.DO_ENV, "DO_ENV", "digitalocean"],
	];
	for (const [environment, source, provider] of candidates) {
		if (environment !== undefined && environment !== "")
			return { environment, source, provider };
	}
	return {
		environment: frameworkDefault(),
		source: "framework-default",
		provider: null,
	};
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
