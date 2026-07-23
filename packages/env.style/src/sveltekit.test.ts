import { afterEach, describe, expect, it, vi } from "vitest";
import { envStyleFavicon } from "./sveltekit";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("envStyleFavicon", () => {
	it("uses the tinted favicon when the Vite-defined flag is active", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		expect(envStyleFavicon("/favicon.svg")).toBe("/__envstyle/icon.png");
	});

	it("preserves the fallback when the Vite-defined flag is inactive", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", false);
		expect(envStyleFavicon("/assets/favicon.svg")).toBe("/assets/favicon.svg");
	});

	it("prefixes the tinted favicon with a SvelteKit base path", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		expect(envStyleFavicon("/assets/favicon.svg", "/docs")).toBe(
			"/docs/__envstyle/icon.png",
		);
	});

	it("detects an active environment outside Vite-processed code", () => {
		vi.stubEnv("ENV_STYLES_ENV", "preview");
		expect(envStyleFavicon("/assets/favicon.svg")).toBe("/__envstyle/icon.png");
	});

	it("lets the Vite-defined flag win over runtime detection", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", false);
		vi.stubEnv("ENV_STYLES_ENV", "development");
		expect(envStyleFavicon("/assets/favicon.svg")).toBe("/assets/favicon.svg");
	});

	it("stays inactive in production outside Vite-processed code", () => {
		vi.stubEnv("ENV_STYLES_ENV", "production");
		expect(envStyleFavicon("/assets/favicon.svg")).toBe("/assets/favicon.svg");
	});
});
