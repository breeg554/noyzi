import { createFileRoute } from "@tanstack/react-router";
import { latestImageRedirect } from "#/lib/image/image.ts";

export const Route = createFileRoute("/img/latest/$")({
	server: {
		handlers: {
			GET: ({ request }) => latestImageRedirect(request),
		},
	},
});
