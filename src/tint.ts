import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import decodeIco from "decode-ico";
import type { Sharp } from "sharp";

export const OUT_DIR = "__envstyle";
/** Where writeTintedIcon's output is served from, relative to the site root. */
export const TINTED_ICON_URL = `/${OUT_DIR}/icon.png`;

export const SIZE = 64;
const TINT_ALPHA = 0.75;
const TOLERANCE = 48; // redmean distance below which a pixel counts as an excluded color and stays untinted
const RAMP = 32; // soft edge avoids halos around antialiased pixels

type Rgb = { r: number; g: number; b: number };

export function findSourceIcons(root: string, candidates: string[]): string[] {
	return candidates
		.map((rel) => path.join(root, rel))
		.filter((abs) => existsSync(abs));
}

/** Write the tinted icon into publicDir/__envstyle/, which self-gitignores. */
export async function writeTintedIcon(
	publicDir: string,
	png: Buffer,
): Promise<void> {
	const outDir = path.join(publicDir, OUT_DIR);
	await mkdir(outDir, { recursive: true });
	await writeFile(path.join(outDir, "icon.png"), png);
	await writeFile(path.join(outDir, ".gitignore"), "*\n");
}

/** A custom icon is the user's own env styling — serve it untouched. */
export async function customIconPng(
	root: string,
	customIcon?: string,
): Promise<Buffer | null> {
	if (!customIcon) return null;
	const resolved = path.resolve(root, customIcon);
	const png = existsSync(resolved) ? await toPngBase(resolved) : null;
	if (!png)
		console.warn(
			`env.style: icon "${customIcon}" not readable — falling back to auto-discovery`,
		);
	return png;
}

/** URL the found icon is conventionally served at, e.g. app/icon.png → /icon.png. */
export function iconUrl(iconPath: string): string {
	return `/${path.basename(iconPath)}`;
}

export function parseHex(color: string): Rgb {
	const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
	if (!m)
		throw new Error(
			`env.style: invalid color "${color}" — expected #rgb or #rrggbb`,
		);
	let hex = m[1];
	if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
	return {
		r: parseInt(hex.slice(0, 2), 16),
		g: parseInt(hex.slice(2, 4), 16),
		b: parseInt(hex.slice(4, 6), 16),
	};
}

/**
 * Tint the icon at iconPath toward the env color (color atop the icon's opaque
 * pixels, alpha preserved). No icon → plain colored circle.
 */
export async function tintIcon(
	iconPath: string | null,
	color: string,
	excludeColors: string[] = [],
): Promise<Buffer> {
	const rgba = parseHex(color);
	const { default: sharp } = await import("sharp");
	const base = iconPath ? await toPngBase(iconPath) : null;
	if (!base) {
		const r = SIZE / 2;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="${color}"/></svg>`;
		return sharp(Buffer.from(svg)).png().toBuffer();
	}
	if (excludeColors.length > 0)
		return tintWithExcludeMask(base, rgba, excludeColors.map(parseHex));
	const overlay = await sharp({
		create: {
			width: SIZE,
			height: SIZE,
			channels: 4,
			background: { ...rgba, alpha: TINT_ALPHA },
		},
	})
		.png()
		.toBuffer();
	return sharp(base)
		.composite([{ input: overlay, blend: "atop" }])
		.png()
		.toBuffer();
}

function redmeanDistance(a: Rgb, b: Rgb): number {
	const rMean = (a.r + b.r) / 2;
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return Math.sqrt(
		(2 + rMean / 256) * dr * dr +
			4 * dg * dg +
			(2 + (255 - rMean) / 256) * db * db,
	);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

async function tintWithExcludeMask(
	base: Buffer,
	tint: Rgb,
	excludeColors: Rgb[],
): Promise<Buffer> {
	const { default: sharp } = await import("sharp");
	const { data, info } = await sharp(base)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const out = Buffer.from(data);

	for (let i = 0; i < out.length; i += 4) {
		if (out[i + 3] === 0) continue;
		const original = { r: out[i], g: out[i + 1], b: out[i + 2] };
		let distance = Infinity;
		for (const excluded of excludeColors)
			distance = Math.min(distance, redmeanDistance(original, excluded));
		const alpha =
			TINT_ALPHA * smoothstep(TOLERANCE, TOLERANCE + RAMP, distance);
		out[i] = Math.round(tint.r * alpha + original.r * (1 - alpha));
		out[i + 1] = Math.round(tint.g * alpha + original.g * (1 - alpha));
		out[i + 2] = Math.round(tint.b * alpha + original.b * (1 - alpha));
	}

	return sharp(out, {
		raw: { width: info.width, height: info.height, channels: 4 },
	})
		.png()
		.toBuffer();
}

/** Decode any supported icon (ico/png/jpg/svg) to a 64px PNG, untinted. */
export async function toPngBase(iconPath: string): Promise<Buffer | null> {
	try {
		const { default: sharp } = await import("sharp");
		const raw = await readFile(iconPath);
		let img: Sharp;
		if (iconPath.endsWith(".ico")) {
			const frames = decodeIco(raw);
			const best = frames.reduce((a, b) => (b.width > a.width ? b : a));
			img =
				best.type === "png"
					? sharp(best.data)
					: sharp(best.data, {
							raw: { width: best.width, height: best.height, channels: 4 },
						});
		} else {
			img = sharp(raw); // png / jpg / svg
		}
		return await img
			.resize(SIZE, SIZE, {
				fit: "contain",
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			})
			.png()
			.toBuffer();
	} catch {
		return null; // unreadable icon → callers pick their fallback (circle or auto-discovery)
	}
}
