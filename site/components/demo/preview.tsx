"use client";

import { useEffect, useState } from "react";
import { ENVS } from "@/lib/envs";
import { useDemo } from "./provider";

function TabStrip({
	icons,
	activeEnv,
	onSelect,
}: {
	icons: Record<string, string>;
	activeEnv: string;
	onSelect: (id: string) => void;
}) {
	return (
		<div className="flex shrink-0 items-end gap-1 overflow-x-auto border-b border-border bg-muted px-3 pt-2">
			<div className="mr-2 mb-2.5 flex shrink-0 gap-1.5" aria-hidden>
				<span className="size-2.5 rounded-full bg-border" />
				<span className="size-2.5 rounded-full bg-border" />
				<span className="size-2.5 rounded-full bg-border" />
			</div>
			<div
				role="tablist"
				aria-label="Environments"
				className="flex min-w-0 gap-1"
			>
				{ENVS.map((env) => {
					const selected = env.id === activeEnv;
					return (
						<button
							key={env.id}
							type="button"
							role="tab"
							aria-selected={selected}
							aria-label={env.id}
							onClick={() => onSelect(env.id)}
							className={`flex min-w-0 items-center gap-1.5 rounded-t-lg px-3 py-2 font-mono text-xs transition-colors ${
								selected
									? "bg-card text-foreground"
									: "text-muted-foreground hover:bg-card/50 hover:text-foreground"
							}`}
						>
							<img
								src={icons[env.id]}
								alt=""
								className="size-4 shrink-0 rounded-[3px]"
							/>
							{/* identical titles on purpose — the favicon is the only tell */}
							<span className="truncate">Acme Inc</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

/** Mobile-only stand-in for BrowserPreview: pinned above a section's editor, scoped to that section's icons. */
export function MiniBrowserPreview({ section }: { section: "color" | "icon" }) {
	const {
		state: { sectionIcons },
	} = useDemo();
	const [activeEnv, setActiveEnv] = useState(ENVS[0].id);

	return (
		<div className="overflow-hidden rounded-t-xl border border-b-0 border-border bg-card">
			<TabStrip
				icons={sectionIcons[section]}
				activeEnv={activeEnv}
				onSelect={setActiveEnv}
			/>
		</div>
	);
}

/** Fake browser chrome; clicking a tab retints this page's real favicon. */
export function BrowserPreview() {
	const {
		state: { icons, activeEnv },
		actions: { setActiveEnv },
	} = useDemo();
	const active = ENVS.find((env) => env.id === activeEnv) ?? ENVS[0];

	useEffect(() => {
		// Next emits its own metadata icon link — swap every icon link or the browser may keep the old one
		for (const link of document.querySelectorAll<HTMLLinkElement>(
			'link[rel~="icon"]',
		)) {
			link.href = icons[active.id];
		}
	}, [active.id, icons]);

	return (
		// nested masks (bottom, then right) fade the card into the page so only the
		// browser's top-left corner reads as chrome — nesting avoids mask-composite quirks
		<div className="h-full [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
			<div className="flex h-full flex-col overflow-hidden rounded-tl-xl border-t border-l border-border bg-card [mask-image:linear-gradient(to_right,black_60%,transparent)]">
				<TabStrip icons={icons} activeEnv={active.id} onSelect={setActiveEnv} />

				{/* skeleton dashboard — deliberately colorless; the tabs above are the demo */}
				<div className="flex flex-1 gap-5 p-5" aria-hidden>
					<div className="flex w-24 shrink-0 flex-col gap-3">
						<div className="mb-2 size-6 rounded-md bg-muted" />
						<div className="h-2.5 w-full rounded-full bg-muted" />
						<div className="h-2.5 w-4/5 rounded-full bg-muted" />
						<div className="h-2.5 w-full rounded-full bg-muted" />
						<div className="h-2.5 w-3/5 rounded-full bg-muted" />
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-4">
						<div className="h-4 w-32 rounded-full bg-muted" />
						<div className="grid grid-cols-3 gap-3">
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									className="flex flex-col gap-2 rounded-lg border border-border p-3"
								>
									<div className="h-2 w-1/2 rounded-full bg-muted" />
									<div className="h-3.5 w-2/3 rounded-full bg-muted" />
								</div>
							))}
						</div>
						<div className="flex h-48 shrink-0 items-end gap-2 rounded-lg border border-border p-3">
							{["40%", "65%", "30%", "80%", "55%", "90%", "45%", "70%"].map(
								(height, i) => (
									<div
										key={i}
										className="flex-1 rounded-t bg-muted"
										style={{ height }}
									/>
								),
							)}
						</div>
						{/* table rows soak up whatever height is left and crop into the fade */}
						<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-lg border border-border p-4">
							{[
								"w-1/3",
								"w-1/4",
								"w-2/5",
								"w-1/3",
								"w-1/5",
								"w-2/5",
								"w-1/4",
								"w-1/3",
							].map((width, i) => (
								<div key={i} className="flex shrink-0 items-center gap-3">
									<div className="size-4 rounded-full bg-muted" />
									<div className={`h-2.5 rounded-full bg-muted ${width}`} />
									<div className="ml-auto h-2.5 w-12 rounded-full bg-muted" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
