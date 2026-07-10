import { afterEach, describe, expect, it, vi } from "vitest";
import { TINTED_ICON_192_URL, TINTED_ICON_URL } from "./constants";
import { envStyleLinks } from "./tanstack-start";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("envStyleLinks", () => {
	it("uses the Vite-defined active flag when present", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		expect(envStyleLinks()).toEqual([
			{ rel: "icon", href: TINTED_ICON_URL },
			{ rel: "apple-touch-icon", href: TINTED_ICON_192_URL },
		]);

		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", false);
		expect(envStyleLinks()).toEqual([]);
	});

	it("lets the define win over runtime env detection", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		vi.stubEnv("ENV_STYLES_ENV", "production");
		expect(envStyleLinks()).toEqual([
			{ rel: "icon", href: TINTED_ICON_URL },
			{ rel: "apple-touch-icon", href: TINTED_ICON_192_URL },
		]);

		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", false);
		vi.stubEnv("ENV_STYLES_ENV", "development");
		expect(envStyleLinks()).toEqual([]);
	});

	it("stays inert in production", () => {
		vi.stubEnv("ENV_STYLES_ENV", "production");
		expect(envStyleLinks()).toEqual([]);
	});

	it("supports env detection precedence", () => {
		vi.stubEnv("ENV_STYLES_ENV", "development");
		vi.stubEnv("VERCEL_TARGET_ENV", "production");
		vi.stubEnv("VERCEL_ENV", "production");
		expect(envStyleLinks()).toEqual([
			{ rel: "icon", href: TINTED_ICON_URL },
			{ rel: "apple-touch-icon", href: TINTED_ICON_192_URL },
		]);

		vi.unstubAllEnvs();
		vi.stubEnv("VERCEL_TARGET_ENV", "production");
		vi.stubEnv("VERCEL_ENV", "preview");
		expect(envStyleLinks()).toEqual([]);

		vi.unstubAllEnvs();
		vi.stubEnv("VERCEL_ENV", "preview");
		expect(envStyleLinks()).toEqual([
			{ rel: "icon", href: TINTED_ICON_URL },
			{ rel: "apple-touch-icon", href: TINTED_ICON_192_URL },
		]);
	});
});
