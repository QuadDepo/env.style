"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { IconFade } from "../icon-fade";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CONFIG_FILES, type ConfigFile, useDemo } from "./provider";

const FRAMEWORKS: Record<
	ConfigFile,
	{ name: string; icon: (props: { className?: string }) => React.JSX.Element }
> = {
	next: { name: "Next.js", icon: NextIcon },
	vite: { name: "Vite", icon: ViteIcon },
};

export function FrameworkSelect() {
	const { state, actions } = useDemo();
	const { name } = FRAMEWORKS[state.file];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="framework"
				className="flex items-center gap-1.5 rounded-md p-1 font-mono text-xs text-foreground transition-[color,background-color,scale] hover:bg-muted active:scale-[0.96]"
			>
				<span className="relative size-3.5 shrink-0">
					<IconFade show={state.file === "next"}>
						<NextIcon className="size-full" />
					</IconFade>
					<IconFade show={state.file === "vite"}>
						<ViteIcon className="size-full" />
					</IconFade>
				</span>
				{name}
				<ChevronDownIcon className="size-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{(Object.keys(CONFIG_FILES) as ConfigFile[]).map((id) => {
					const { name, icon: ItemIcon } = FRAMEWORKS[id];
					return (
						<DropdownMenuItem key={id} onClick={() => actions.setFile(id)}>
							<ItemIcon className="size-3.5" />
							{name}
							{state.file === id && <CheckIcon className="ml-auto size-3.5" />}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function NextIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z" />
		</svg>
	);
}

function ViteIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M13.056 23.238a.57.57 0 0 1-1.02-.355v-5.202c0-.63-.512-1.143-1.144-1.143H5.148a.57.57 0 0 1-.464-.903l3.777-5.29c.54-.753 0-1.804-.93-1.804H.57a.574.574 0 0 1-.543-.746.6.6 0 0 1 .08-.157L5.008.78a.57.57 0 0 1 .467-.24h14.589a.57.57 0 0 1 .466.903l-3.778 5.29c-.54.755 0 1.806.93 1.806h5.745c.238 0 .424.138.513.322a.56.56 0 0 1-.063.603z" />
		</svg>
	);
}
