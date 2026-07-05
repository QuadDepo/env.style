"use client";

import { useEffect, useRef, useState } from "react";
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
const TOUR_INTERVAL_MS = 2600;

export function OptionsGuide() {
	const { state } = useDemo();
	const [selected, setSelected] = useState<OptionId>("color");
	const touringRef = useRef(true);
	const active = OPTIONS.find((option) => option.id === selected)!;
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
					<div className="overflow-x-auto border-b border-border p-6 font-mono text-[13px] leading-loose whitespace-pre lg:border-b-0 lg:border-r lg:border-border lg:p-16">
						<p className="text-muted-foreground/60">{scaffold.open}</p>
						{OPTIONS.map((option) => {
							const isSelected = selected === option.id;
							return (
								<button
									key={option.id}
									type="button"
									aria-pressed={isSelected}
									onClick={() => handleSelect(option.id)}
									className={`block w-full cursor-pointer border-l-2 pl-2 text-left transition-colors ${
										isSelected
											? "border-primary bg-muted"
											: "border-transparent hover:bg-muted/50"
									}`}
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
					<div className="flex flex-col gap-2 p-6 lg:min-h-44 lg:p-16">
						<span className="font-mono text-sm font-medium">{active.id}</span>
						<span className="font-mono text-xs text-muted-foreground">
							{active.type}
						</span>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{active.description}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
