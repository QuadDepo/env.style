/** ponytail: canvas source-atop mirrors src/tint.ts (sharp `atop` blend, TINT_ALPHA 0.75) — excludeColors not simulated. */
const SIZE = 64;
const TINT_ALPHA = 0.75;

// base is /tints/production.png (untinted original) — /favicon.svg gets rewritten by withEnvStyles in dev/preview
let base: Promise<HTMLImageElement> | undefined;

function loadBase(): Promise<HTMLImageElement> {
	base ??= new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = "/tints/production.png";
	});
	return base;
}

export async function tintFavicon(color: string): Promise<string> {
	const img = await loadBase();
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	if (!ctx) return img.src;
	ctx.drawImage(img, 0, 0, SIZE, SIZE);
	ctx.globalCompositeOperation = "source-atop";
	ctx.globalAlpha = TINT_ALPHA;
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, SIZE, SIZE);
	return canvas.toDataURL("image/png");
}
