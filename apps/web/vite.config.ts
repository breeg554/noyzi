import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		alias: {
			"@noyzi/core": fileURLToPath(
				new URL("../../packages/core/src/index.ts", import.meta.url),
			),
			"@noyzi/react": fileURLToPath(
				new URL("../../packages/react/src/index.ts", import.meta.url),
			),
		},
		tsconfigPaths: true,
	},
	plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
