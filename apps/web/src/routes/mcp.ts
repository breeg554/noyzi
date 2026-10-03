import { createFileRoute } from "@tanstack/react-router";
import { mcpResponse } from "#/lib/mcp.ts";

export const Route = createFileRoute("/mcp")({
	server: {
		handlers: {
			ANY: ({ request }) => mcpResponse(request),
		},
	},
});
