import react from "@vitejs/plugin-react";
import { envStyle } from "env.style/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react(),
		envStyle({
			color: {
				development: "#00ff00",
			},
		}),
	],
});
