import { afterEach, describe, expect, it, vi } from "vitest";
import {
	TINTED_ICON_192_URL,
	TINTED_ICON_512_URL,
	TINTED_ICON_URL,
} from "./constants";
import { envStyleManifest, rewriteManifestIcons } from "./manifest";

const manifest = {
	name: "Test",
	icons: [
		{ src: "/icon-64.png", sizes: "64x64" },
		{ src: "/icon-192.png", sizes: "192x192" },
		{ src: "/icon-512.png", sizes: "512x512" },
		{ src: "/icon-any.png", sizes: "any" },
	],
};

afterEach(() => vi.unstubAllEnvs());

describe("manifest rewriting", () => {
	it("shares the complete size mapping", () => {
		expect(
			rewriteManifestIcons(manifest).icons.map((icon) => icon.src),
		).toEqual([
			TINTED_ICON_URL,
			TINTED_ICON_192_URL,
			TINTED_ICON_512_URL,
			"/icon-any.png",
		]);
	});

	it("leaves production manifests unchanged", () => {
		vi.stubEnv("NODE_ENV", "production");
		expect(envStyleManifest(manifest)).toBe(manifest);
	});

	it("rewrites active manifests and honors kill switches", () => {
		expect(envStyleManifest(manifest, { environment: "preview" })).not.toBe(
			manifest,
		);
		expect(
			envStyleManifest(manifest, { environment: "preview", enabled: false }),
		).toBe(manifest);
		expect(
			envStyleManifest(manifest, { environment: "preview", pwa: false }),
		).toBe(manifest);
	});
});
