import { TINTED_ICON_URL } from "./constants";
import {
	detectEnv,
	type EnvStylesOptions,
	validateColorOptions,
} from "./env";

export type { EnvStylesOptions } from "./env";

export type EnvStyleLink = {
	rel: "icon";
	href: string;
};

export function envStyleLinks(options: EnvStylesOptions = {}): EnvStyleLink[] {
	validateColorOptions(options);
	const definedActive = (
		globalThis as { __ENV_STYLE_FAVICON_ACTIVE__?: boolean }
	).__ENV_STYLE_FAVICON_ACTIVE__;
	const runtimeEnv = detectEnv(options.environment, () =>
		typeof process !== "undefined" && process.env?.NODE_ENV === "development"
			? "development"
			: "production",
	);
	const active =
		typeof definedActive === "boolean"
			? definedActive
			: options.enabled !== false && runtimeEnv !== "production";
	return active ? [{ rel: "icon", href: TINTED_ICON_URL }] : [];
}
