"use client";

import {
	createContext,
	type ReactNode,
	use,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { IconValue } from "@/components/icon-picker";
import { tintFavicon } from "@/lib/tint-client";

export type { IconValue };

export const DEFAULT_COLORS: Record<string, string> = {
	development: "#3b82f6",
	preview: "#f59e0b",
	staging: "#6b7280",
};

// default state serves the committed PNGs — real tintIcon output, not the canvas approximation
const STATIC_ICONS: Record<string, string> = {
	development: "/tints/development.png",
	preview: "/tints/preview.png",
	staging: "/tints/staging.png",
	production: "/tints/production.png",
};

const DEFAULT_CUSTOM_ICONS: Record<string, IconValue | null> = {
	development: { src: "/premade/acme-favicon.png", path: "./acme-favicon.png" },
	preview: {
		src: "/premade/triangle-favicon.png",
		path: "./triangle-favicon.png",
	},
	staging: { src: "/premade/acme-favicon-1.png", path: "./acme-favicon-1.png" },
	production: null,
};

export const CONFIG_FILES = {
	next: "next.config.ts",
	vite: "vite.config.ts",
	waku: "waku.config.ts",
} as const;
export type ConfigFile = keyof typeof CONFIG_FILES;

interface DemoState {
	colors: Record<string, string>;
	/** Custom icon per env, or null when using the default (tinted/static) icon. */
	customIcons: Record<string, IconValue | null>;
	icons: Record<string, string>;
	/** Both sections' icon maps, keyed regardless of `activeSection` — lets mobile mini previews hard-wire to one section. */
	sectionIcons: Record<"color" | "icon", Record<string, string>>;
	file: ConfigFile;
	/** Env id shown in the preview; driven by scroll section and manual tab clicks. */
	activeEnv: string;
	/** Which scroll section is in view; determines whether `icons` shows custom icons or colors only. */
	activeSection: "color" | "icon";
}

interface DemoActions {
	setColor: (id: string, value: string) => void;
	/** A custom icon is the user's own env styling — used as-is, never tinted (mirrors the `icon` option). */
	setIcon: (id: string, icon: IconValue | null) => void;
	setFile: (file: ConfigFile) => void;
	setActiveEnv: (id: string) => void;
	setActiveSection: (section: "color" | "icon") => void;
}

interface DemoContextValue {
	state: DemoState;
	actions: DemoActions;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo(): DemoContextValue {
	const ctx = use(DemoContext);
	if (!ctx) throw new Error("useDemo must be used within <DemoProvider>");
	return ctx;
}

export function DemoProvider({ children }: { children: ReactNode }) {
	const [colors, setColors] = useState(DEFAULT_COLORS);
	const [customIcons, setCustomIcons] = useState(DEFAULT_CUSTOM_ICONS);
	const [tintedIcons, setTintedIcons] = useState(STATIC_ICONS);
	const [file, setFile] = useState<ConfigFile>("next");
	const [activeEnv, setActiveEnv] = useState("development");
	const [activeSection, setActiveSection] = useState<"color" | "icon">("color");
	// drives the tint effect below (static PNGs vs live canvas tints), not exposed directly
	const colorsDirty = Object.keys(DEFAULT_COLORS).some(
		(id) => colors[id] !== DEFAULT_COLORS[id],
	);

	useEffect(() => {
		if (!colorsDirty) {
			setTintedIcons(STATIC_ICONS);
			return;
		}
		let stale = false;
		Promise.all(
			Object.entries(colors).map(
				async ([id, c]) => [id, await tintFavicon(c)] as const,
			),
		).then((tinted) => {
			if (!stale)
				setTintedIcons({ ...STATIC_ICONS, ...Object.fromEntries(tinted) });
		});
		return () => {
			stale = true;
		};
	}, [colors, colorsDirty]);

	const actions = useMemo<DemoActions>(
		() => ({
			setColor: (id, value) => setColors((c) => ({ ...c, [id]: value })),
			setIcon: (id, icon) => setCustomIcons((c) => ({ ...c, [id]: icon })),
			setFile,
			setActiveEnv,
			setActiveSection,
		}),
		[],
	);

	// memoized: a fresh object identity here would defeat the value memo below
	// color section ignores custom icons entirely; icon section falls back to tint (mirrors the library)
	const sectionIcons = useMemo(
		() => ({
			color: tintedIcons,
			icon: Object.fromEntries(
				Object.keys(tintedIcons).map((id) => [
					id,
					customIcons[id]?.src ?? tintedIcons[id],
				]),
			),
		}),
		[tintedIcons, customIcons],
	);

	const icons = sectionIcons[activeSection];

	const value = useMemo<DemoContextValue>(
		() => ({
			state: {
				colors,
				customIcons,
				icons,
				sectionIcons,
				file,
				activeEnv,
				activeSection,
			},
			actions,
		}),
		[
			colors,
			customIcons,
			icons,
			sectionIcons,
			file,
			activeEnv,
			activeSection,
			actions,
		],
	);

	return <DemoContext value={value}>{children}</DemoContext>;
}
