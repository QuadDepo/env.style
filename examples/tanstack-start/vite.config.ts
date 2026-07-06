import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { envStyle } from "env.style/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3125,
	},
	plugins: [
		tanstackStart(),
		nitro(),
		viteReact(),
		envStyle({
			color: {
				development: "#00ff00",
			},
		}),
	],
});
