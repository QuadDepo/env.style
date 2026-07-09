"use client";

import { ColorPicker } from "../color-picker";
import {
	ConfigSnippet,
	type SnippetBlock,
	TOKEN_TRIGGER_CLASS,
	TokenShell,
} from "./config-snippet";
import { useDemo } from "./provider";
import { useSectionEnv } from "./use-section-env";

export function ColorEditor() {
	const { state, actions } = useDemo();
	const sectionRef = useSectionEnv("color", () => "development");

	const option: SnippetBlock = {
		jsx: (indent: string) => (
			<>
				{indent}color: {"{\n"}
				{Object.entries(state.colors).map(([id, value]) => (
					<span key={id}>
						{indent}
						{"  "}
						{id}:{" "}
						<ColorToken
							value={value}
							label={`${id} color`}
							onChange={(v) => actions.setColor(id, v)}
						/>
						{",\n"}
					</span>
				))}
				{indent}
				{"},"}
			</>
		),
		source: (indent: string) =>
			`${indent}color: {\n${Object.entries(state.colors)
				.map(([id, value]) => `${indent}  ${id}: '${value}',`)
				.join("\n")}\n${indent}},`,
	};

	return (
		<div ref={sectionRef}>
			<ConfigSnippet option={option} />
		</div>
	);
}

function ColorToken({
	value,
	label,
	onChange,
}: {
	value: string;
	label: string;
	onChange: (value: string) => void;
}) {
	return (
		<TokenShell>
			<ColorPicker
				color={value}
				onChange={onChange}
				trigger={
					<span
						role="button"
						tabIndex={0}
						aria-label={label}
						style={{ backgroundColor: value }}
						className={TOKEN_TRIGGER_CLASS}
					/>
				}
			/>
			<span style={{ color: value }} className="transition-colors duration-300">
				&apos;{value}&apos;
			</span>
		</TokenShell>
	);
}
