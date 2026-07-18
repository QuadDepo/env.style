import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
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
import { type Manifest, rewriteManifestIcons } from "./manifest";
import {
	customIconPng,
	customIconsPng,
	findSourceIcons,
	tintAllSizes,
	tintIcon,
	writeTintedIcon,
	writeTintedIcons,
} from "./tint";

export type { EnvStylesOptions } from "./env";

const VITE_ICON_NAMES = [
	"favicon.ico",
	"favicon.svg",
	"favicon.png",
	"icon.svg",
	"icon.png",
];
const ACTIVE_DEFINE = "globalThis.__ENV_STYLE_FAVICON_ACTIVE__";
const PWA_DEFINE = "globalThis.__ENV_STYLE_PWA_ACTIVE__";

function viteDefaultEnv(mode: string, command: string): string {
	return mode === "production" || command !== "serve"
		? "production"
		: "development";
}

function isActive(options: EnvStylesOptions, env: string): boolean {
	return options.enabled !== false && env !== "production";
}

export function envStyle(options: EnvStylesOptions = {}): Plugin {
	validateColorOptions(options);

	let active = false;
	let png: Buffer | null = null;
	let png192: Buffer | null = null;
	let png512: Buffer | null = null;
	let publicDir = "";
	let rewrittenManifests = new Set<string>();

	return {
		name: "env-style",
		config(_config, env) {
			const active = isActive(
				options,
				detectEnv(options.environment, () =>
					viteDefaultEnv(env.mode, env.command),
				),
			);
			return {
				define: {
					[ACTIVE_DEFINE]: JSON.stringify(active),
					[PWA_DEFINE]: JSON.stringify(active && options.pwa !== false),
				},
			};
		},
		async configResolved(config) {
			const env = detectEnv(options.environment, () =>
				viteDefaultEnv(config.mode, config.command),
			);
			active = isActive(options, env);
			if (!active) return;

			const color = resolveColor(env, options.color);
			const icon = resolveIcon(env, options.icon);
			const colorOpacity = resolveColorOpacity(options);
			publicDir = path.resolve(config.root, config.publicDir);
			try {
				const icons = findSourceIcons(
					config.root,
					viteIconCandidates(config.root, publicDir),
				);
				if (options.pwa === false) {
					png =
						(await customIconPng(config.root, icon)) ??
						(await tintIcon(
							icons[0] ?? null,
							color,
							options.excludeColors ?? [],
							colorOpacity,
						));
					await writeTintedIcon(publicDir, png);
				} else {
					const customIcons = await customIconsPng(config.root, icon);
					if (customIcons) {
						png = customIcons.get(64) ?? null;
						png192 = customIcons.get(192) ?? null;
						png512 = customIcons.get(512) ?? null;
						await writeTintedIcons(publicDir, customIcons);
					} else {
						const tintedIcons = await tintAllSizes(
							icons[0] ?? null,
							color,
							options.excludeColors ?? [],
							colorOpacity,
						);
						png = tintedIcons.get(64) ?? null;
						png192 = tintedIcons.get(192) ?? null;
						png512 = tintedIcons.get(512) ?? null;
						await writeTintedIcons(publicDir, tintedIcons);
					}
					rewrittenManifests = rewriteManifestFiles(publicDir);
				}
			} catch (err) {
				active = false;
				png = null;
				png192 = null;
				png512 = null;
				console.warn(
					`env.style: favicon tinting skipped — ${err instanceof Error ? err.message : err}`,
				);
			}
		},
		transformIndexHtml(html) {
			if (!active) return html;
			let out = rewriteIconLinks(html, options.pwa !== false);
			if (options.pwa !== false)
				out = rewriteManifestLink(out, rewrittenManifests);
			return out;
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url?.split("?")[0];
				if (!active || req.method !== "GET") return next();

				if (url === TINTED_ICON_URL && png) {
					res.statusCode = 200;
					res.setHeader("Content-Type", "image/png");
					res.setHeader("Cache-Control", "no-store");
					return res.end(png);
				}
				if (url === TINTED_ICON_192_URL && png192) {
					res.statusCode = 200;
					res.setHeader("Content-Type", "image/png");
					res.setHeader("Cache-Control", "no-store");
					return res.end(png192);
				}
				if (url === TINTED_ICON_512_URL && png512) {
					res.statusCode = 200;
					res.setHeader("Content-Type", "image/png");
					res.setHeader("Cache-Control", "no-store");
					return res.end(png512);
				}
				if (url === "/favicon.ico" && png) {
					res.statusCode = 200;
					res.setHeader("Content-Type", "image/png");
					res.setHeader("Cache-Control", "no-store");
					return res.end(png);
				}

				// Serve rewritten manifest
				if (url && MANIFEST_FILES.includes(url.replace(/^\//, ""))) {
					const manifestPath = path.join(publicDir, url.replace(/^\//, ""));
					if (existsSync(manifestPath)) {
						try {
							const content = readFileSync(manifestPath, "utf-8");
							const manifest = rewriteManifestIcons(
								JSON.parse(content) as Manifest,
							);
							res.statusCode = 200;
							res.setHeader("Content-Type", "application/manifest+json");
							res.setHeader("Cache-Control", "no-store");
							return res.end(JSON.stringify(manifest));
						} catch {
							// Fall through to static file serving
						}
					}
				}

				return next();
			});
		},
	};
}

function viteIconCandidates(root: string, publicDir: string): string[] {
	return VITE_ICON_NAMES.map((name) =>
		path.relative(root, path.join(publicDir, name)),
	);
}

function rewriteIconLinks(html: string, pwa: boolean): string {
	let found = false;
	const out = html.replace(/<link\b[^>]*>/gi, (tag) => {
		const rel =
			/\brel=(["'])(.*?)\1/i.exec(tag)?.[2].toLowerCase().split(/\s+/) ?? [];
		if (!rel.includes("icon") && !rel.includes("apple-touch-icon")) return tag;
		// Use 192px icon for apple-touch-icon, standard icon for others
		const isAppleTouch = rel.includes("apple-touch-icon");
		if (isAppleTouch && !pwa) return tag;
		found = true;
		const targetUrl = isAppleTouch ? TINTED_ICON_192_URL : TINTED_ICON_URL;
		if (/\bhref=(["'])[^"']*\1/i.test(tag)) {
			return tag.replace(
				/\bhref=(["'])[^"']*\1/i,
				(_match, quote: string) => `href=${quote}${targetUrl}${quote}`,
			);
		}
		return tag.replace(/\s*\/?>$/, ` href="${targetUrl}">`);
	});
	if (found) return out;
	const link = `<link rel="icon" href="${TINTED_ICON_URL}">`;
	return /<\/head>/i.test(out)
		? out.replace(/<\/head>/i, `  ${link}\n</head>`)
		: `${link}\n${out}`;
}

function rewriteManifestLink(html: string, rewritten: Set<string>): string {
	return html.replace(/<link\b[^>]*rel=["']manifest["'][^>]*>/gi, (tag) => {
		const href = /\bhref=(["'])([^"']*)\1/i.exec(tag)?.[2];
		if (href) {
			const filename = path.posix.basename(href.split(/[?#]/)[0]);
			if (!rewritten.has(filename)) return tag;
			return tag.replace(
				/\bhref=(["'])[^"']*\1/i,
				(_match, quote: string) =>
					`href=${quote}/__envstyle/${filename}${quote}`,
			);
		}
		return tag;
	});
}

const MANIFEST_FILES = [
	"manifest.json",
	"manifest.webmanifest",
	"site.webmanifest",
];

function rewriteManifestFiles(publicDir: string): Set<string> {
	const rewritten = new Set<string>();
	for (const filename of MANIFEST_FILES) {
		const manifestPath = path.join(publicDir, filename);
		if (!existsSync(manifestPath)) continue;
		try {
			const content = readFileSync(manifestPath, "utf-8");
			const manifest = rewriteManifestIcons(JSON.parse(content) as Manifest);
			if (!manifest.icons) continue;
			const outDir = path.join(publicDir, "__envstyle");
			mkdirSync(outDir, { recursive: true });
			writeFileSync(
				path.join(outDir, filename),
				JSON.stringify(manifest, null, "\t"),
			);
			rewritten.add(filename);
		} catch {
			// Skip invalid manifest files
		}
	}
	return rewritten;
}
