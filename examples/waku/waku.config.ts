import { envStyle } from "env.style/waku";
import { defineConfig } from "waku/config";

export default defineConfig({
	vite: {
		plugins: [
			envStyle({
				color: {
					development: "#00ff00",
				},
			}),
		],
	},
});
