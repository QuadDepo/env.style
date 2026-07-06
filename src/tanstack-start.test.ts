import { afterEach, describe, expect, it, vi } from "vitest";
import { envStyleLinks } from "./tanstack-start";
import { TINTED_ICON_URL } from "./tint";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("envStyleLinks", () => {
	it("uses the Vite-defined active flag when present", () => {
		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", true);
		expect(envStyleLinks()).toEqual([{ rel: "icon", href: TINTED_ICON_URL }]);

		vi.stubGlobal("__ENV_STYLE_FAVICON_ACTIVE__", false);
		expect(envStyleLinks({ environment: "development" })).toEqual([]);
	});

	it("stays inert in production", () => {
		expect(envStyleLinks({ environment: "production" })).toEqual([]);
	});

	it("supports env detection precedence", () => {
		vi.stubEnv("ENV_STYLES_ENV", "development");
		vi.stubEnv("VERCEL_TARGET_ENV", "production");
		vi.stubEnv("VERCEL_ENV", "production");
		expect(envStyleLinks()).toEqual([{ rel: "icon", href: TINTED_ICON_URL }]);

		vi.unstubAllEnvs();
		vi.stubEnv("VERCEL_TARGET_ENV", "production");
		vi.stubEnv("VERCEL_ENV", "preview");
		expect(envStyleLinks()).toEqual([]);

		vi.unstubAllEnvs();
		vi.stubEnv("VERCEL_ENV", "preview");
		expect(envStyleLinks()).toEqual([{ rel: "icon", href: TINTED_ICON_URL }]);
	});

	it("honors the enabled kill switch and validates options", () => {
		expect(
			envStyleLinks({ environment: "development", enabled: false }),
		).toEqual([]);
		expect(() => envStyleLinks({ color: { development: "blue" } })).toThrow(
			/invalid color/,
		);
	});
});
