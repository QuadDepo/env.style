import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "env.style — your environments at a glance";

// Satori silently falls back to a serif face unless fonts are embedded explicitly.
const fontDir = path.join(
	process.cwd(),
	"node_modules/geist/dist/fonts/geist-sans",
);
const geistRegular = readFileSync(path.join(fontDir, "Geist-Regular.ttf"));
const geistSemiBold = readFileSync(path.join(fontDir, "Geist-SemiBold.ttf"));

// Dark-theme tokens (globals.css oklch values) resolved to hex, plus the tints from src/env.ts.
const PAGE_BG = "#0a0a0a";
const CARD_BG = "#1c1c1e";
const CHROME_BG = "#161618";
const MUTED = "#27272a";
const BORDER = "rgba(250, 250, 250, 0.10)";
const FG = "#fafafa";
const FG_MUTED = "#a1a1aa";

// mirrors the default tints in src/env.ts; production keeps the plain mark
const TABS = [
	{ label: "Acme Inc", color: "#3b82f6", active: true },
	{ label: "Acme Inc", color: "#f59e0b", active: false },
	{ label: "Acme Inc", color: "#fafafa", active: false },
];

function Favicon({ color }: { color: string }) {
	return (
		<div
			style={{
				display: "flex",
				width: 20,
				height: 20,
				borderRadius: 5,
				background: "#18181b",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				style={{ width: 9, height: 9, borderRadius: 999, background: color }}
			/>
		</div>
	);
}

function Bar({
	width,
	height = 10,
	color = MUTED,
}: {
	width: number | string;
	height?: number;
	color?: string;
}) {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: 999,
				background: color,
				flexShrink: 0,
			}}
		/>
	);
}

export default function OgImage() {
	return new ImageResponse(
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				display: "flex",
				background: PAGE_BG,
				color: FG,
				fontFamily: "Geist",
				overflow: "hidden",
			}}
		>
			{/* atmospheric glow behind the card */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					background:
						"radial-gradient(60% 60% at 54% 85%, rgba(59,130,246,0.12), rgba(10,10,10,0) 55%)",
				}}
			/>

			{/* faux browser card — left edge flush with the text block, dissolving to the right */}
			<div
				style={{
					position: "absolute",
					top: 290,
					left: 80,
					width: 1140,
					height: 480,
					display: "flex",
					flexDirection: "column",
					background: CARD_BG,
					borderTop: `1px solid ${BORDER}`,
					borderLeft: `1px solid ${BORDER}`,
					borderTopLeftRadius: 20,
					overflow: "hidden",
				}}
			>
				{/* tab strip — top padding lives on the tabs row so the dots center against the full chrome height */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						gap: 6,
						padding: "0 14px",
						background: CHROME_BG,
					}}
				>
					<div
						style={{
							display: "flex",
							gap: 8,
							marginRight: 10,
							alignSelf: "center",
						}}
					>
						<div
							style={{
								width: 14,
								height: 14,
								borderRadius: 999,
								background: MUTED,
							}}
						/>
						<div
							style={{
								width: 14,
								height: 14,
								borderRadius: 999,
								background: MUTED,
							}}
						/>
						<div
							style={{
								width: 14,
								height: 14,
								borderRadius: 999,
								background: MUTED,
							}}
						/>
					</div>
					<div style={{ display: "flex", gap: 4, paddingTop: 10 }}>
						{TABS.map((tab) => (
							<div
								key={tab.color}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									padding: "10px 14px",
									borderTopLeftRadius: 10,
									borderTopRightRadius: 10,
									background: tab.active ? CARD_BG : "transparent",
									color: tab.active ? FG : FG_MUTED,
									fontSize: 20,
								}}
							>
								<Favicon color={tab.color} />
								<div style={{ display: "flex" }}>{tab.label}</div>
							</div>
						))}
					</div>
				</div>

				{/* skeleton dashboard — deliberately colorless; the tabs are the story */}
				<div style={{ display: "flex", flex: 1, gap: 20, padding: 24 }}>
					{/* sidebar */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							width: 110,
							flexShrink: 0,
							gap: 12,
						}}
					>
						<div
							style={{
								width: 26,
								height: 26,
								borderRadius: 8,
								background: MUTED,
								marginBottom: 8,
							}}
						/>
						<Bar width="100%" />
						<Bar width="80%" />
						<Bar width="100%" />
						<Bar width="60%" />
					</div>

					{/* main column */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							gap: 16,
						}}
					>
						<Bar width={140} height={16} />
						{/* three stat cards */}
						<div style={{ display: "flex", gap: 12 }}>
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									style={{
										display: "flex",
										flexDirection: "column",
										flex: 1,
										gap: 10,
										padding: 14,
										borderRadius: 10,
										border: `1px solid ${BORDER}`,
									}}
								>
									<Bar width="50%" height={8} />
									<Bar width="66%" height={14} />
								</div>
							))}
						</div>
						{/* bar chart */}
						<div
							style={{
								display: "flex",
								alignItems: "flex-end",
								gap: 8,
								height: 190,
								padding: 14,
								borderRadius: 10,
								border: `1px solid ${BORDER}`,
							}}
						>
							{[40, 65, 30, 80, 55, 90, 45, 70, 60, 35, 75, 50].map((h, i) => (
								<div
									key={i}
									style={{
										flex: 1,
										height: `${h}%`,
										borderTopLeftRadius: 4,
										borderTopRightRadius: 4,
										background: MUTED,
									}}
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* fade overlays recreate the site's masks (Satori has no mask-image) */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					background:
						"linear-gradient(to bottom, rgba(10,10,10,0) 68%, #0a0a0a 99%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					background:
						"linear-gradient(to right, rgba(10,10,10,0) 38%, #0a0a0a 86%)",
				}}
			/>

			{/* text block, top-left */}
			<div
				style={{
					position: "absolute",
					top: 80,
					left: 80,
					display: "flex",
					flexDirection: "column",
					maxWidth: 560,
					gap: 14,
				}}
			>
				<div
					style={{
						fontSize: 80,
						fontWeight: 600,
						lineHeight: 1,
						letterSpacing: "-0.03em",
						color: FG,
					}}
				>
					env.style
				</div>
				<div
					style={{
						fontSize: 32,
						fontWeight: 400,
						lineHeight: 1.4,
						color: FG_MUTED,
					}}
				>
					Your environments at a glance
				</div>
			</div>
		</div>,
		{
			...size,
			fonts: [
				{ name: "Geist", data: geistRegular, weight: 400, style: "normal" },
				{ name: "Geist", data: geistSemiBold, weight: 600, style: "normal" },
			],
		},
	);
}
