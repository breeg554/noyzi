import { fileURLToPath } from "node:url";
import { generate, seedHash, toSvg } from "../../src/index.ts";
import { caseName, RASTER_CASES } from "./cases.ts";
import { grainOf, lookOf } from "./look.ts";

export interface ReferenceCase {
	name: string;
	look: { width: number; height: number; rgb: string };
	grain: number;
}

export interface Reference {
	browser: string;
	cases: ReferenceCase[];
}

const svgs = RASTER_CASES.map((c) =>
	toSvg(generate(seedHash(c.seed), c.options), { width: c.width, height: c.height }),
);

const page = `<!doctype html><meta charset="utf-8"><title>Noyzi browser reference</title>
<body style="font:16px system-ui;padding:24px">Capturing…<script type="module">
const svgs = ${JSON.stringify(svgs)};
for (const [index, svg] of svgs.entries()) {
	const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
	const img = new Image();
	img.src = url;
	await img.decode();
	const canvas = document.createElement("canvas");
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	await fetch("/pixels/" + index, { method: "POST", body: data });
}
await fetch("/done", { method: "POST", body: navigator.userAgent });
document.body.textContent = "Saved. You can close this tab.";
</script>`;

const cases: ReferenceCase[] = [];
const output = fileURLToPath(new URL("./reference.json", import.meta.url));

const server = Bun.serve({
	port: 4322,
	async fetch(request) {
		const path = new URL(request.url).pathname;
		if (path.startsWith("/pixels/")) {
			const index = Number(path.slice("/pixels/".length));
			const c = RASTER_CASES[index];
			if (!c) return new Response("bad case", { status: 400 });
			const data = new Uint8Array(await request.arrayBuffer());
			const look = lookOf(data, c.width, c.height);
			cases[index] = {
				name: caseName(c),
				look: {
					width: look.width,
					height: look.height,
					rgb: Buffer.from(look.rgb).toString("base64"),
				},
				grain: Math.round(grainOf(data, c.width, c.height) * 1000) / 1000,
			};
			console.log(`  ${caseName(c)}: grain ${cases[index].grain}`);
			return new Response("ok");
		}
		if (path === "/done") {
			const agent = await request.text();
			const browser = /Edg\//.test(agent)
				? "edge"
				: /Chrome\//.test(agent)
					? "chrome"
					: /Safari\//.test(agent)
						? "safari"
						: "other";
			const reference: Reference = { browser, cases };
			await Bun.write(output, `${JSON.stringify(reference, null, "\t")}\n`);
			console.log(`Saved ${output} from ${browser}.`);
			setTimeout(() => process.exit(0), 100);
			return new Response("ok");
		}
		return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
	},
});

console.log(`Open ${server.url} in Chrome to capture how the browser draws the SVGs.`);
