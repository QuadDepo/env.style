import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import type { ResolvedConfig } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EnvStylesOptions, envStyle } from "./vite";

let dir: string;
beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "envstyle-vite-"));
});

afterEach(() => {
	vi.unstubAllEnvs();
});

type TestPlugin = {
	configResolved(config: ResolvedConfig): void | Promise<void>;
	transformIndexHtml(html: string): string | Promise<string>;
};

function plugin(options: EnvStylesOptions = {}): TestPlugin {
	return envStyle(options) as unknown as TestPlugin;
}

function config(
	command: "serve" | "build" = "serve",
	mode = command === "serve" ? "development" : "production",
): ResolvedConfig {
	return {
		root: dir,
		publicDir: path.join(dir, "public"),
		command,
		mode,
	} as ResolvedConfig;
}

function activeDefine(
	options: EnvStylesOptions = {},
	command: "serve" | "build" = "serve",
	mode = command === "serve" ? "development" : "production",
): string {
	const p = envStyle(options) as unknown as {
		config(
			_: unknown,
			env: { command: "serve" | "build"; mode: string },
		): {
			define: Record<string, string>;
		};
	};
	return p.config({}, { command, mode }).define[
		"globalThis.__ENV_STYLE_FAVICON_ACTIVE__"
	];
}

async function writeSvg() {
	await mkdir(path.join(dir, "public"), { recursive: true });
	await writeFile(
		path.join(dir, "public/favicon.svg"),
		'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#111"/><text x="24" y="42" fill="#fff">V</text></svg>',
	);
}

async function squarePng(): Promise<Buffer> {
	return sharp({
		create: {
			width: 32,
			height: 32,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	})
		.png()
		.toBuffer();
}

async function centerPixel(
	png: Buffer,
): Promise<{ r: number; g: number; b: number; a: number }> {
	const { data, info } = await sharp(png)
		.raw()
		.toBuffer({ resolveWithObject: true });
	const i =
		(Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) *
		info.channels;
	return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

describe("envStyle", () => {
	it("defines the browser active flag from the same env rules", () => {
		expect(activeDefine({}, "serve")).toBe("true");
		expect(activeDefine({}, "build")).toBe("false");
		expect(activeDefine({}, "serve", "production")).toBe("false");

		vi.stubEnv("ENV_STYLES_ENV", "preview");
		expect(activeDefine({}, "build")).toBe("true");

		vi.unstubAllEnvs();
		vi.stubEnv("VERCEL_TARGET_ENV", "production");
		vi.stubEnv("VERCEL_ENV", "preview");
		expect(activeDefine({}, "build")).toBe("false");
	});

	it("leaves production inert", async () => {
		const p = plugin({ environment: "production" });
		await p.configResolved(config("build"));
		const html =
			'<html><head><link rel="icon" href="/favicon.svg"></head><body></body></html>';
		expect(await p.transformIndexHtml(html)).toBe(html);
		expect(existsSync(path.join(dir, "public/__envstyle/icon.png"))).toBe(
			false,
		);
	});

	it("leaves production mode inert when a framework reports serve", async () => {
		const p = plugin();
		await p.configResolved(config("serve", "production"));
		const html =
			'<html><head><link rel="icon" href="/favicon.svg"></head><body></body></html>';
		expect(await p.transformIndexHtml(html)).toBe(html);
		expect(existsSync(path.join(dir, "public/__envstyle/icon.png"))).toBe(
			false,
		);
	});

	it("styles development by writing and rewriting Vite favicon links", async () => {
		await writeSvg();
		const p = plugin({
			environment: "development",
			color: { development: "#00ff00" },
		});
		await p.configResolved(config());

		const png = await readFile(path.join(dir, "public/__envstyle/icon.png"));
		expect(png.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
		expect(
			await readFile(path.join(dir, "public/__envstyle/.gitignore"), "utf8"),
		).toBe("*\n");

		const linked = await p.transformIndexHtml(
			'<html><head><link rel="icon" href="/favicon.svg"></head></html>',
		);
		expect(linked).toContain('<link rel="icon" href="/__envstyle/icon.png">');

		const injected = await p.transformIndexHtml(
			"<html><head></head><body></body></html>",
		);
		expect(injected).toContain('<link rel="icon" href="/__envstyle/icon.png">');
	});

	it("rewrites apple touch icons to the 192px asset", async () => {
		await writeSvg();
		const p = plugin({ environment: "development" });
		await p.configResolved(config());

		const html = await p.transformIndexHtml(
			'<html><head><link rel="apple-touch-icon" href="/apple.png"></head></html>',
		);
		expect(html).toContain(
			'<link rel="apple-touch-icon" href="/__envstyle/icon-192.png">',
		);
	});

	it("generates a rewritten manifest before the public directory is copied", async () => {
		await writeSvg();
		await writeFile(
			path.join(dir, "public/site.webmanifest"),
			JSON.stringify({
				icons: [
					{ src: "/old-64.png", sizes: "64x64" },
					{ src: "/old-192.png", sizes: "192x192" },
					{ src: "/old-512.png", sizes: "512x512" },
				],
			}),
		);
		const p = plugin({ environment: "development" });
		await p.configResolved(config());

		const generated = JSON.parse(
			await readFile(
				path.join(dir, "public/__envstyle/site.webmanifest"),
				"utf8",
			),
		);
		expect(generated.icons.map((icon: { src: string }) => icon.src)).toEqual([
			"/__envstyle/icon.png",
			"/__envstyle/icon-192.png",
			"/__envstyle/icon-512.png",
		]);
		const html = await p.transformIndexHtml(
			'<link rel="manifest" href="/site.webmanifest">',
		);
		expect(html).toContain('href="/__envstyle/site.webmanifest"');
	});

	it("keeps the original manifest link when no rewritten manifest was generated", async () => {
		await writeSvg();
		await writeFile(
			path.join(dir, "public/manifest.json"),
			JSON.stringify({ name: "No icons" }),
		);
		const p = plugin({ environment: "development" });
		await p.configResolved(config());
		const original = '<link rel="manifest" href="/manifest.json">';
		expect(await p.transformIndexHtml(original)).toContain(original);
		expect(existsSync(path.join(dir, "public/__envstyle/manifest.json"))).toBe(
			false,
		);
	});

	it("disables PWA assets and manifest rewriting when pwa is false", async () => {
		await writeSvg();
		await writeFile(
			path.join(dir, "public/manifest.json"),
			JSON.stringify({ icons: [{ src: "/old.png", sizes: "192x192" }] }),
		);
		const p = plugin({ environment: "development", pwa: false });
		await p.configResolved(config());

		expect(existsSync(path.join(dir, "public/__envstyle/icon.png"))).toBe(true);
		expect(existsSync(path.join(dir, "public/__envstyle/icon-192.png"))).toBe(
			false,
		);
		expect(existsSync(path.join(dir, "public/__envstyle/manifest.json"))).toBe(
			false,
		);
		const original = '<link rel="manifest" href="/manifest.json">';
		expect(await p.transformIndexHtml(original)).toContain(original);
		const apple = '<link rel="apple-touch-icon" href="/apple.png">';
		const transformed = await p.transformIndexHtml(apple);
		expect(transformed).toContain(apple);
		expect(transformed).toContain(
			'<link rel="icon" href="/__envstyle/icon.png">',
		);
	});

	it("serves the per-env icon map entry for the active env", async () => {
		await writeSvg();
		await mkdir(path.join(dir, "public"), { recursive: true });
		await writeFile(path.join(dir, "public/dev-icon.png"), await squarePng());

		const p = plugin({
			environment: "development",
			icon: { development: "public/dev-icon.png" },
		});
		await p.configResolved(config());

		const png = await readFile(path.join(dir, "public/__envstyle/icon.png"));
		const center = await centerPixel(png);
		expect(center).toEqual({ r: 255, g: 255, b: 255, a: 255 });
	});

	it("falls back to tinting when the icon map has no entry for the active env", async () => {
		await writeSvg();
		const p = plugin({
			environment: "development",
			icon: { staging: "public/staging-icon.png" },
		});
		await p.configResolved(config());

		const png = await readFile(path.join(dir, "public/__envstyle/icon.png"));
		expect(png.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	});

	it("throws immediately on invalid colors", () => {
		expect(() => envStyle({ color: { development: "green" } })).toThrow(
			/invalid color/,
		);
		expect(() => envStyle({ excludeColors: ["white"] })).toThrow(
			/invalid color/,
		);
	});
});
