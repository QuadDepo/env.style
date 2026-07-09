"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FrameworkSelect } from "./demo/framework-select";
import { CONFIG_FILES, useDemo } from "./demo/provider";

type OptionId = "enabled" | "environment" | "color" | "icon" | "excludeColors";

const OPTIONS: {
	id: OptionId;
	prefix: string;
	value: string;
	type: string;
	description: string;
}[] = [
	{
		id: "enabled",
		prefix: "enabled: ",
		value: "true",
		type: "boolean, default true",
		description: "Turn env.style off for a specific environment or CI job.",
	},
	{
		id: "environment",
		prefix: "environment: ",
		value: "'staging'",
		type: "string",
		description:
			"Set the environment yourself. Otherwise env.style uses ENV_STYLES_ENV, then Vercel, then the framework default.",
	},
	{
		id: "color",
		prefix: "color: { staging: ",
		value: "'#ff00ff'",
		type: "Partial<Record<string, string>>",
		description:
			"Set tint colors by environment. Unset environments use the defaults.",
	},
	{
		id: "icon",
		prefix: "icon: { staging: ",
		value: "'./flask.svg'",
		type: "string | Partial<Record<string, string>>",
		description:
			"Use one icon everywhere, or set icons per environment. Missing icons fall back to tinting.",
	},
	{
		id: "excludeColors",
		prefix: "excludeColors: [",
		value: "'#e94435'",
		type: "string[]",
		description: "Keep brand colors untouched while tinting.",
	},
];

// suffix closes whatever the prefix opened, so it stays dimmed with the prefix
const SUFFIXES: Record<OptionId, string> = {
	enabled: ",",
	environment: ",",
	color: " },",
	icon: " },",
	excludeColors: "],",
};

// wrapper lines around the option rows, dimmer than the interactive lines
const SCAFFOLD = {
	next: {
		open: "export default withEnvStyles(nextConfig, {",
		close: "});",
		indent: "  ",
	},
	vite: {
		open: "export default defineConfig({\n  plugins: [\n    react(),\n    envStyle({",
		close: "    }),\n  ],\n});",
		indent: "      ",
	},
} as const;

// interval for the passive tour that cycles the selection until the user interacts
const TOUR_INTERVAL_MS = 4000;

export function OptionsGuide() {
	const { state } = useDemo();
	const [selected, setSelected] = useState<OptionId>("color");
	const touringRef = useRef(true);
	const codeRef = useRef<HTMLDivElement>(null);
	// measured box of the selected row; one absolutely-positioned div glides between rows
	const [highlight, setHighlight] = useState<{
		top: number;
		left: number;
		width: number;
		height: number;
	} | null>(null);
	const scaffold = SCAFFOLD[state.file];

	// auto-cycles the selection as a passive tour; stops for good on first click
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}
		const id = setInterval(() => {
			if (!touringRef.current) return;
			setSelected((current) => {
				const index = OPTIONS.findIndex((option) => option.id === current);
				return OPTIONS[(index + 1) % OPTIONS.length].id;
			});
		}, TOUR_INTERVAL_MS);
		return () => clearInterval(id);
	}, []);

	// remeasures on selection and (via the observer) when the scaffold or breakpoint reflows the rows
	useLayoutEffect(() => {
		const container = codeRef.current;
		if (!container) return;
		const measure = () => {
			const row = container.querySelector<HTMLElement>(
				`[data-option="${selected}"]`,
			);
			if (!row) return;
			setHighlight({
				top: row.offsetTop,
				left: row.offsetLeft,
				width: row.offsetWidth,
				height: row.offsetHeight,
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(container);
		return () => observer.disconnect();
	}, [selected]);

	function handleSelect(id: OptionId) {
		touringRef.current = false;
		setSelected(id);
	}

	// pulled up into the sticky run-out; the curtain's solid zone hides the preview behind it.
	// -mt-56 pairs with the left column's pb-110 — retune together
	return (
		<section className="relative z-20 flex flex-col gap-8 lg:-mt-56">
			<h2 className="text-2xl font-semibold tracking-tight">
				Tune the details
			</h2>
			<div className="overflow-hidden rounded-lg border border-border bg-card">
				<div className="flex items-center justify-between border-b border-border px-4 py-2">
					<span className="font-mono text-xs text-muted-foreground">
						{CONFIG_FILES[state.file]}
					</span>
					<FrameworkSelect />
				</div>
				<div className="grid lg:grid-cols-2">
					<div
						ref={codeRef}
						className="relative overflow-x-auto border-b border-border p-6 font-mono text-[13px] leading-loose whitespace-pre lg:border-b-0 lg:border-r lg:border-border lg:p-16"
					>
						{highlight && (
							<div
								aria-hidden
								style={highlight}
								className="pointer-events-none absolute border-l-2 border-foreground bg-muted transition-[top,left,width,height] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
							/>
						)}
						<p className="text-muted-foreground/60">{scaffold.open}</p>
						{OPTIONS.map((option) => {
							const isSelected = selected === option.id;
							return (
								// relative: paints above the highlight (rows keep the transparent border for spacing)
								<button
									key={option.id}
									type="button"
									data-option={option.id}
									aria-pressed={isSelected}
									onClick={() => handleSelect(option.id)}
									className={cn(
										"relative block w-full cursor-pointer border-l-2 border-transparent pl-2 text-left transition-colors",
										!isSelected && "hover:bg-muted/50",
									)}
								>
									<span className="text-muted-foreground">
										{scaffold.indent}
										{option.prefix}
									</span>
									<span className="text-foreground">{option.value}</span>
									<span className="text-muted-foreground">
										{SUFFIXES[option.id]}
									</span>
								</button>
							);
						})}
						<p className="text-muted-foreground/60">{scaffold.close}</p>
					</div>
					{/* all panels share one grid cell so the card keeps the tallest option's height — no jump when descriptions wrap differently */}
					<div className="grid p-6 lg:p-16">
						{/* cross-fade: visibility flips only once the fade ends, and stays out of the a11y tree while hidden */}
						{OPTIONS.map((option) => (
							<div
								key={option.id}
								className={cn(
									"col-start-1 row-start-1 flex flex-col gap-2 transition-[opacity,filter,visibility] duration-500 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
									option.id === selected
										? "opacity-100 blur-none"
										: "invisible opacity-0 blur-[2px]",
								)}
							>
								<span className="font-mono text-sm font-medium">
									{option.id}
								</span>
								<span className="font-mono text-xs text-muted-foreground">
									{option.type}
								</span>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{option.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
