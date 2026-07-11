import { createFileRoute } from "@tanstack/react-router";

const origin = "https://noyzi.dev";
const paths = ["/", "/docs", "/examples"];

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: () => {
				const urls = paths
					.map((path) => `  <url><loc>${origin}${path}</loc></url>`)
					.join("\n");
				const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

				return new Response(sitemap, {
					headers: {
						"Cache-Control": "public, max-age=3600",
						"Content-Type": "application/xml",
					},
				});
			},
		},
	},
});
