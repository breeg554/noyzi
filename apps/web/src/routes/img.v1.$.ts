import { createFileRoute } from "@tanstack/react-router";
import { imageResponse } from "#/lib/image/image.ts";

export const Route = createFileRoute("/img/v1/$")({
	server: {
		handlers: {
			GET: ({ request }) => imageResponse(request, "v1"),
		},
	},
});
