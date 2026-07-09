/** Demo environments; colors mirror src/env.ts defaults, icons are real tintIcon output. */
export type DemoEnv = {
	id: string;
	label: string;
	color: string | null;
	note: string;
};

export const ENVS: DemoEnv[] = [
	{ id: "development", label: "dev", color: "#3b82f6", note: "default blue" },
	{ id: "preview", label: "preview", color: "#f59e0b", note: "default amber" },
	{
		id: "staging",
		label: "staging",
		color: "#6b7280",
		note: "no color configured → gray fallback",
	},
	{ id: "production", label: "prod", color: null, note: "never touched" },
];
