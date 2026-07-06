import path from "node:path";
import type { Plugin } from "vite";
import {
	detectEnv,
	type EnvStylesOptions,
	resolveColor,
	resolveIcon,
	validateColorOptions,
} from "./env";
import {
	customIconPng,
	findSourceIcons,
	TINTED_ICON_URL,
	tintIcon,
	writeTintedIcon,
} from "./tint";

export type { EnvStylesOptions } from "./env";

const VITE_ICON_NAMES = [
	"favicon.ico",
	"favicon.svg",
	"favicon.png",
	"icon.svg",
	"icon.png",
];

export function envStyle(options: EnvStylesOptions = {}): Plugin {
	validateColorOptions(options);

	let active = false;
	let png: Buffer | null = null;

	return {
		name: "env-style",
		async configResolved(config) {
			const env = detectEnv(options.environment, () =>
				config.mode === "production" || config.command !== "serve"
					? "production"
					: "development",
			);
			active = options.enabled !== false && env !== "production";
			if (!active) return;

			const color = resolveColor(env, options.color);
			const icon = resolveIcon(env, options.icon);
			const publicDir = path.resolve(config.root, config.publicDir);
			try {
				const icons = findSourceIcons(
					config.root,
					viteIconCandidates(config.root, publicDir),
				);
				png =
					(await customIconPng(config.root, icon)) ??
					(await tintIcon(
						icons[0] ?? null,
						color,
						options.excludeColors ?? [],
					));
				await writeTintedIcon(publicDir, png);
			} catch (err) {
				active = false;
				png = null;
				console.warn(
					`env.style: favicon tinting skipped — ${err instanceof Error ? err.message : err}`,
				);
			}
		},
		transformIndexHtml(html) {
			return active ? rewriteIconLinks(html) : html;
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url?.split("?")[0];
				if (
					!active ||
					!png ||
					req.method !== "GET" ||
					(url !== "/favicon.ico" && url !== TINTED_ICON_URL)
				) {
					return next();
				}
				res.statusCode = 200;
				res.setHeader("Content-Type", "image/png");
				res.setHeader("Cache-Control", "no-store");
				res.end(png);
			});
		},
	};
}

function viteIconCandidates(root: string, publicDir: string): string[] {
	return VITE_ICON_NAMES.map((name) =>
		path.relative(root, path.join(publicDir, name)),
	);
}

function rewriteIconLinks(html: string): string {
	let found = false;
	const out = html.replace(/<link\b[^>]*>/gi, (tag) => {
		const rel =
			/\brel=(["'])(.*?)\1/i.exec(tag)?.[2].toLowerCase().split(/\s+/) ?? [];
		if (!rel.includes("icon")) return tag;
		found = true;
		if (/\bhref=(["'])[^"']*\1/i.test(tag)) {
			return tag.replace(
				/\bhref=(["'])[^"']*\1/i,
				(_match, quote: string) => `href=${quote}${TINTED_ICON_URL}${quote}`,
			);
		}
		return tag.replace(/\s*\/?>$/, ` href="${TINTED_ICON_URL}">`);
	});
	if (found) return out;
	const link = `<link rel="icon" href="${TINTED_ICON_URL}">`;
	return /<\/head>/i.test(out)
		? out.replace(/<\/head>/i, `  ${link}\n</head>`)
		: `${link}\n${out}`;
}
