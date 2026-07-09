export type Rgb = { r: number; g: number; b: number };

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
