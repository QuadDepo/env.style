"use client";

import { ENVS } from "@/lib/envs";
import { dim } from "../code-block";
import { IconPicker, type IconValue } from "../icon-picker";
import {
	ConfigSnippet,
	type SnippetBlock,
	TOKEN_TRIGGER_CLASS,
	TokenShell,
} from "./config-snippet";
import { useDemo } from "./provider";
import { useSectionEnv } from "./use-section-env";

// production is never styled — a missing env in the map falls back to tinting, so there's no
// production row here (mirrors color-editor.tsx's layout)
const ICON_ENVS = ENVS.filter((env) => env.id !== "production");

export function IconEditor() {
	const { state, actions } = useDemo();
	// resolves at fire time: first env with a custom icon, or skip if none is set
	const sectionRef = useSectionEnv(
		"icon",
		() => ENVS.find((env) => state.customIcons[env.id])?.id ?? null,
	);

	const option: SnippetBlock = {
		jsx: (indent: string) => (
			<>
				{indent}icon: {"{\n"}
				{ICON_ENVS.map((env) => {
					const value = state.customIcons[env.id] ?? null;
					return (
						<span key={env.id}>
							{indent}
							{"  "}
							{value ? (
								<>
									{env.id}:{" "}
									<IconToken
										value={value}
										label={`${env.id} icon`}
										onChange={(v) => actions.setIcon(env.id, v)}
									/>
									{",\n"}
								</>
							) : (
								<>
									{dim(`// ${env.id}: `)}
									<IconToken
										value={value}
										label={`${env.id} icon`}
										onChange={(v) => actions.setIcon(env.id, v)}
									/>{" "}
									{dim("tinted\n")}
								</>
							)}
						</span>
					);
				})}
				{indent}
				{"},"}
			</>
		),
		source: (indent: string) => {
			const set = ICON_ENVS.filter((env) => state.customIcons[env.id]);
			if (set.length === 0) return `${indent}icon: {},`;
			return `${indent}icon: {\n${set
				.map(
					(env) =>
						`${indent}  ${env.id}: '${state.customIcons[env.id]!.path}',`,
				)
				.join("\n")}\n${indent}},`;
		},
	};

	return (
		<div ref={sectionRef}>
			<ConfigSnippet option={option} />
		</div>
	);
}

function IconToken({
	value,
	label,
	onChange,
}: {
	value: IconValue | null;
	label: string;
	onChange: (value: IconValue | null) => void;
}) {
	return (
		<TokenShell>
			<IconPicker
				icon={value}
				onChange={onChange}
				trigger={
					value ? (
						<img
							role="button"
							tabIndex={0}
							aria-label={label}
							src={value.src}
							alt=""
							className={TOKEN_TRIGGER_CLASS}
						/>
					) : (
						<span
							role="button"
							tabIndex={0}
							aria-label={label}
							className={`${TOKEN_TRIGGER_CLASS} border-dashed`}
						/>
					)
				}
			/>
			{value && (
				<span className="text-foreground">&apos;{value.path}&apos;</span>
			)}
		</TokenShell>
	);
}
