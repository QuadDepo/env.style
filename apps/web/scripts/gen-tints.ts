// Generates the demo favicons with the real library code, so the showcase is
// genuine output, not a CSS approximation. Committed as static assets — rerun
// after changing favicon.svg: `pnpm gen-tints` (Node >= 22.18).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tintIcon, toPngBase } from "../../packages/env.style/src/tint.ts";

// ponytail: hexes copied from packages/env.style/src/env.ts DEFAULT_COLORS/FALLBACK_COLOR — env.ts
// can't be imported here (extensionless './tint' import breaks Node type stripping)

const root = path.dirname(new URL(import.meta.url).pathname);
const logo = path.join(root, "../public/favicon.svg");
const outDir = path.join(root, "../public/tints");

const envs: Record<string, string | null> = {
	development: "#3b82f6",
	preview: "#f59e0b",
	staging: "#6b7280", // no default color → gray fallback
	production: null, // never touched
};

await mkdir(outDir, { recursive: true });
for (const [env, color] of Object.entries(envs)) {
	const png = color ? await tintIcon(logo, color) : await toPngBase(logo);
	if (!png) throw new Error(`could not render ${env}`);
	await writeFile(path.join(outDir, `${env}.png`), png);
	console.log(`tints/${env}.png ${color ?? "(untinted)"}`);
}
