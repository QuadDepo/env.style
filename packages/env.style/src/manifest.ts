import {
	TINTED_ICON_192_URL,
	TINTED_ICON_512_URL,
	TINTED_ICON_URL,
} from "./constants";
import { detectEnv, type EnvStylesOptions } from "./env";

/**
 * Size-mapped icon URLs for PWA manifests.
 * Maps common PWA sizes to their tinted counterparts.
 */
const SIZE_URL_MAP: Record<string, string> = {
	"192x192": TINTED_ICON_192_URL,
	"512x512": TINTED_ICON_512_URL,
	"64x64": TINTED_ICON_URL,
};

export interface ManifestIcon {
	src: string;
	sizes?: string;
	type?: string;
	purpose?: string;
}

export interface Manifest {
	name?: string;
	short_name?: string;
	description?: string;
	start_url?: string;
	display?: string;
	background_color?: string;
	theme_color?: string;
	icons?: ManifestIcon[];
	[key: string]: unknown;
}

/**
 * Rewrite a manifest's icon URLs to point to tinted versions.
 * Used in Next.js App Router's `app/manifest.ts`.
 *
 * @example
 * ```ts
 * import type { MetadataRoute } from 'next'
 * import { envStyleManifest } from 'env.style/manifest'
 *
 * export default function manifest(): MetadataRoute.Manifest {
 *   return envStyleManifest({
 *     name: 'My App',
 *     icons: [
 *       { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
 *       { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
 *     ],
 *   })
 * }
 * ```
 */
export function rewriteManifestIcons<T extends Manifest>(manifest: T): T {
	if (!manifest.icons) return manifest;

	return {
		...manifest,
		icons: manifest.icons.map((icon) => {
			const tintedUrl = icon.sizes ? SIZE_URL_MAP[icon.sizes] : undefined;
			return tintedUrl ? { ...icon, src: tintedUrl } : icon;
		}),
	};
}

export function envStyleManifest<T extends Manifest>(
	manifest: T,
	options: EnvStylesOptions = {},
): T {
	const environment = detectEnv(options.environment, () =>
		typeof process !== "undefined" && process.env.NODE_ENV === "development"
			? "development"
			: "production",
	);
	if (
		options.enabled === false ||
		options.pwa === false ||
		environment === "production"
	)
		return manifest;
	return rewriteManifestIcons(manifest);
}
