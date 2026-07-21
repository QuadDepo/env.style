import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TINTED_ICON_192_URL, TINTED_ICON_URL } from "./constants";
import { EnvStyle } from "./waku";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("EnvStyle", () => {
	it("renders Waku metadata links when the Vite plugin activates it", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		expect(renderToStaticMarkup(EnvStyle())).toBe(
			`<link rel="icon" href="${TINTED_ICON_URL}"/><link rel="apple-touch-icon" href="${TINTED_ICON_192_URL}"/>`,
		);
	});

	it("omits PWA metadata when the plugin disables it", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		vi.stubGlobal("__ENV_STYLE_PWA_ACTIVE__", false);
		expect(renderToStaticMarkup(EnvStyle())).toBe(
			`<link rel="icon" href="${TINTED_ICON_URL}"/>`,
		);
	});

	it("renders nothing when the Vite plugin marks production inactive", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", false);
		vi.stubEnv("ENV_STYLES_ENV", "development");
		expect(renderToStaticMarkup(EnvStyle())).toBe("");
	});

	it("falls back to shared runtime environment detection outside Vite", () => {
		vi.stubEnv("ENV_STYLES_ENV", "preview");
		expect(renderToStaticMarkup(EnvStyle())).toContain(TINTED_ICON_URL);

		vi.unstubAllEnvs();
		vi.stubEnv("ENV_STYLES_ENV", "production");
		expect(renderToStaticMarkup(EnvStyle())).toBe("");
	});
});
