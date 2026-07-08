"use client";

import { type ReactElement, useState } from "react";
import { PresetGrid, PresetPopover, PresetTile } from "./preset-popover";

// custom presets-only picker (started as cult-ui's color-picker, everything but the popover replaced);
// includes env.style's default env colors so the defaults stay reachable
const PRESETS = [
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#ec4899",
	"#f43f5e",
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#22c55e",
	"#14b8a6",
	"#06b6d4",
	"#6b7280",
];

export function ColorPicker({
	color,
	onChange,
	trigger,
}: {
	color: string;
	onChange: (color: string) => void;
	/** Element that opens the picker (e.g. an inline swatch). */
	trigger: ReactElement;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<PresetPopover trigger={trigger} open={isOpen} onOpenChange={setIsOpen}>
			<PresetGrid>
				{PRESETS.map((preset) => (
					<PresetTile
						key={preset}
						round
						aria-label={preset}
						selected={color.toLowerCase() === preset}
						style={{ backgroundColor: preset }}
						onClick={() => {
							onChange(preset);
							setIsOpen(false);
						}}
					/>
				))}
			</PresetGrid>
		</PresetPopover>
	);
}
