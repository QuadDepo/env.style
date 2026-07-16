import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import {
	TINTED_ICON_192_URL,
	TINTED_ICON_512_URL,
	TINTED_ICON_URL,
} from "./constants";
import {
	detectEnv,
	type EnvStylesOptions,
	resolveColor,
	resolveColorOpacity,
	resolveIcon,
	validateColorOptions,
} from "./env";
import {
	customIconPng,
	customIconsPng,
	findSourceIcons,
	iconUrl,
	tintAllSizes,
	tintIcon,
	writeTintedIcon,
	writeTintedIcons,
} from "./tint";

export type { EnvStylesOptions } from "./env";
export type { Manifest, ManifestIcon } from "./manifest";
export { envStyleManifest } from "./manifest";

type PhaseCtx = { defaultConfig: NextConfig };
type NextConfigFn = (
	phase: string,
	ctx: PhaseCtx,
) => NextConfig | Promise<NextConfig>;
export type NextConfigInput = NextConfig | NextConfigFn;

const NEXT_ICON_CANDIDATES = [
	"app/favicon.ico",
	"src/app/favicon.ico",
	"app/icon.ico",
	"src/app/icon.ico",
	"app/icon.png",
	"app/icon.svg",
	"app/icon.jpg",
	"app/icon.jpeg",
	"src/app/icon.png",
	"src/app/icon.svg",
	"src/app/icon.jpg",
	"src/app/icon.jpeg",
	"public/favicon.ico",
	"public/favicon.png",
	"public/favicon.svg",
	"public/apple-touch-icon.png",
];

const NEXT_MANIFEST_CANDIDATES = [
	"public/manifest.json",
	"public/manifest.webmanifest",
	"public/site.webmanifest",
	"app/manifest.json",
	"app/manifest.webmanifest",
	"src/app/manifest.json",
	"src/app/manifest.webmanifest",
];

const MANIFEST_SIZE_DESTINATIONS: Record<string, string> = {
	"64x64": TINTED_ICON_URL,
	"192x192": TINTED_ICON_192_URL,
	"512x512": TINTED_ICON_512_URL,
};

export function withEnvStyles(
	nextConfig: NextConfigInput = {},
	options: EnvStylesOptions = {},
): NextConfigInput {
	const env = detectEnv(options.environment, () =>
		process.env.NODE_ENV === "development" ? "development" : "production",
	);
	validateColorOptions(options);
	if (options.enabled === false || env === "production") return nextConfig; // zero footprint

	const color = resolveColor(env, options.color);
	const icon = resolveIcon(env, options.icon);
	const colorOpacity = resolveColorOpacity(options);

	return async (phase, ctx) => {
		const config =
			typeof nextConfig === "function"
				? await nextConfig(phase, ctx)
				: nextConfig;
		return decorate(
			config,
			color,
			options.excludeColors ?? [],
			colorOpacity,
			icon,
			options.pwa !== false,
		);
	};
}

async function decorate(
	config: NextConfig,
	color: string,
	excludeColors: string[],
	colorOpacity: number,
	customIcon?: string,
	pwa = true,
): Promise<NextConfig> {
	const root = process.cwd();
	const icons = findSourceIcons(root, NEXT_ICON_CANDIDATES);
	const sources = [...new Set(["/favicon.ico", ...icons.map(iconUrl)])];
	const manifestRewrites = pwa ? staticManifestRewrites(root) : [];

	try {
		if (!pwa) {
			const png =
				(await customIconPng(root, customIcon)) ??
				(await tintIcon(icons[0] ?? null, color, excludeColors, colorOpacity));
			await writeTintedIcon(path.join(root, "public"), png);
		} else {
			const customIcons = await customIconsPng(root, customIcon);
			if (customIcons) {
				await writeTintedIcons(path.join(root, "public"), customIcons);
			} else {
				const tintedIcons = await tintAllSizes(
					icons[0] ?? null,
					color,
					excludeColors,
					colorOpacity,
				);
				await writeTintedIcons(path.join(root, "public"), tintedIcons);
			}
		}
	} catch (err) {
		console.warn(
			`env.style: favicon tinting skipped — ${err instanceof Error ? err.message : err}`,
		);
		return config;
	}

	const pwaSources = pwa ? [TINTED_ICON_192_URL, TINTED_ICON_512_URL] : [];

	const iconRewrites = sources.map((source) => ({
		source,
		destination:
			pwa && source === "/apple-touch-icon.png"
				? TINTED_ICON_192_URL
				: TINTED_ICON_URL,
	}));
	const rewrites = dedupeRewrites([...manifestRewrites, ...iconRewrites]);

	return {
		...config,
		rewrites: mergeRewrites(config.rewrites, rewrites),
		headers: mergeHeaders(config.headers, [
			...sources,
			...manifestRewrites.map((rewrite) => rewrite.source),
			TINTED_ICON_URL,
			...pwaSources,
		]),
	};
}

type OurRewrite = { source: string; destination: string };

function staticManifestRewrites(root: string): OurRewrite[] {
	const rewrites: OurRewrite[] = [];
	for (const candidate of NEXT_MANIFEST_CANDIDATES) {
		const manifestPath = path.join(root, candidate);
		if (!existsSync(manifestPath)) continue;
		try {
			const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
				icons?: Array<{ src?: unknown; sizes?: unknown }>;
			};
			for (const icon of manifest.icons ?? []) {
				if (typeof icon.src !== "string" || typeof icon.sizes !== "string")
					continue;
				if (!icon.src.startsWith("/") || icon.src.startsWith("//")) continue;
				const destination = MANIFEST_SIZE_DESTINATIONS[icon.sizes];
				if (!destination) continue;
				const source = icon.src.split(/[?#]/)[0];
				if (source) rewrites.push({ source, destination });
			}
		} catch (err) {
			console.warn(
				`env.style: manifest "${candidate}" skipped — ${err instanceof Error ? err.message : err}`,
			);
		}
	}
	return rewrites;
}

function dedupeRewrites(rewrites: OurRewrite[]): OurRewrite[] {
	const seen = new Set<string>();
	return rewrites.filter((rewrite) => {
		if (seen.has(rewrite.source)) return false;
		seen.add(rewrite.source);
		return true;
	});
}

function mergeRewrites(
	user: NextConfig["rewrites"],
	ours: OurRewrite[],
): NextConfig["rewrites"] {
	return async () => {
		const existing = user ? await user() : [];
		if (Array.isArray(existing)) {
			// plain-array user rewrites have afterFiles semantics
			return { beforeFiles: ours, afterFiles: existing, fallback: [] };
		}
		return {
			...existing,
			beforeFiles: [...ours, ...(existing.beforeFiles ?? [])],
		};
	};
}

function mergeHeaders(
	user: NextConfig["headers"],
	paths: string[],
): NextConfig["headers"] {
	// favicons are cached aggressively; a stale one after an env switch reads as broken
	const ours = paths.map((source) => ({
		source,
		headers: [{ key: "Cache-Control", value: "no-store" }],
	}));
	return async () => [...(user ? await user() : []), ...ours];
}
