import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import { IMAGE_HOST, IMAGE_PREFIX } from "./image/host.ts";
import { imageResponse, parseImageRequest } from "./image/image.ts";
import { IMAGE_VERSIONS, LATEST_IMAGE_VERSION } from "./image/versions.ts";
import { mcpResponse } from "./mcp.ts";

const endpoint = new URL("https://noyzi.dev/mcp");

function structuredContent(result: Awaited<ReturnType<Client["callTool"]>>) {
	return result.structuredContent as Record<string, unknown>;
}

async function connectClient(origin?: string) {
	const client = new Client({ name: "noyzi-test", version: "1.0.0" });
	await client.connect(
		new StreamableHTTPClientTransport(endpoint, {
			requestInit: origin ? { headers: { Origin: origin } } : undefined,
			fetch: (input, init) =>
				mcpResponse(
					new Request(input instanceof URL ? input.href : input, init),
				),
		}),
	);
	return client;
}

function post(body: string, headers: Record<string, string> = {}) {
	return mcpResponse(
		new Request(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json, text/event-stream",
				"MCP-Protocol-Version": LATEST_PROTOCOL_VERSION,
				...headers,
			},
			body,
		}),
	);
}

describe("Noyzi MCP", () => {
	let client: Client;

	beforeEach(async () => {
		client = await connectClient();
	});

	afterEach(async () => {
		await client.close();
	});

	test("initializes and advertises one public tool with input and output schemas", async () => {
		expect(client.getServerVersion()?.name).toBe("noyzi");
		const { tools } = await client.listTools();
		expect(tools).toHaveLength(1);
		expect(tools[0]).toMatchObject({
			name: "generate_gradient",
			inputSchema: { required: ["seed"], additionalProperties: false },
			outputSchema: { type: "object" },
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: { securitySchemes: [{ type: "noauth" }] },
		});
	});

	test("returns deterministic defaults and the palette from the frozen renderer", async () => {
		const arguments_ = { seed: "launch" };
		const first = await client.callTool({
			name: "generate_gradient",
			arguments: arguments_,
		});
		const second = await client.callTool({
			name: "generate_gradient",
			arguments: arguments_,
		});
		const renderer = IMAGE_VERSIONS[LATEST_IMAGE_VERSION];
		expect(first.isError).not.toBe(true);
		expect(first.structuredContent).toEqual({
			url: `https://${IMAGE_HOST}/${LATEST_IMAGE_VERSION}/launch.png?w=1000&h=1000`,
			seed: "launch",
			palette: renderer
				.generate(renderer.seedHash("launch"))
				.palette.map((color) => color.hex),
			width: 1000,
			height: 1000,
			format: "png",
			version: LATEST_IMAGE_VERSION,
		});
		expect(second).toEqual(first);
		expect(first.content).toEqual([
			{ type: "text", text: JSON.stringify(first.structuredContent) },
		]);
	});

	test("returns a renderable image URL with exact colors, dimensions, and escaped seed", async () => {
		const seed = "demo/user + 100%?雪#";
		const result = await client.callTool({
			name: "generate_gradient",
			arguments: {
				seed,
				palette: ["#FFF4DF", "#FF9166", "#EAA0C5"],
				width: 320,
				height: 180,
				format: "svg",
			},
		});
		expect(result.isError).not.toBe(true);
		expect(result.structuredContent).toMatchObject({
			seed,
			palette: ["#fff4df", "#ff9166", "#eaa0c5"],
			width: 320,
			height: 180,
			format: "svg",
		});
		const url = new URL(structuredContent(result).url as string);
		expect(url.hostname).toBe(IMAGE_HOST);
		const image = parseImageRequest(
			url.pathname.slice(`/${LATEST_IMAGE_VERSION}/`.length),
			url.search,
		);
		expect(image.seed).toBe(seed);
		expect(image.options.palette).toEqual(["#fff4df", "#ff9166", "#eaa0c5"]);
		url.pathname = `${IMAGE_PREFIX}${url.pathname}`;
		const response = await imageResponse(
			new Request(url),
			LATEST_IMAGE_VERSION,
		);
		expect(response.status).toBe(200);
		expect(await response.text()).toContain('width="320" height="180"');
	});

	test("accepts every supported format and SVG's larger size", async () => {
		for (const format of ["png", "webp", "jpg", "svg"]) {
			const result = await client.callTool({
				name: "generate_gradient",
				arguments: {
					seed: "formats",
					format,
					width: format === "svg" ? 4096 : 2400,
					height: 1,
				},
			});
			expect(result.isError).not.toBe(true);
			expect(structuredContent(result).format).toBe(format);
		}
	});

	test("rejects invalid arguments and oversized raster URLs with tool errors", async () => {
		for (const arguments_ of [
			{},
			{ seed: "" },
			{ seed: "a".repeat(257) },
			{ seed: "\ud800" },
			{ seed: "x", width: 0 },
			{ seed: "x", height: 1.5 },
			{ seed: "x", width: 4097 },
			{ seed: "x", format: "gif" },
			{ seed: "x", palette: ["#ffffff"] },
			{ seed: "x", palette: ["#fff", "red"] },
			{ seed: "x", palette: Array(9).fill("#ffffff") },
			{ seed: "x", unknown: true },
		]) {
			const result = await client.callTool({
				name: "generate_gradient",
				arguments: arguments_,
			});
			expect(result.isError).toBe(true);
		}
		for (const format of ["png", "webp", "jpg"]) {
			const result = await client.callTool({
				name: "generate_gradient",
				arguments: { seed: "x", format, width: 2401 },
			});
			expect(result.isError).toBe(true);
			expect(result.content).toEqual([
				{
					type: "text",
					text: `${format} images are limited to 2400 pixels per side`,
				},
			]);
		}
	});

	test("handles simultaneous clients without sharing message IDs or results", async () => {
		const other = await connectClient();
		try {
			const results = await Promise.all([
				client.callTool({
					name: "generate_gradient",
					arguments: { seed: "first" },
				}),
				other.callTool({
					name: "generate_gradient",
					arguments: { seed: "second" },
				}),
			]);
			expect(results.map((result) => structuredContent(result).seed)).toEqual([
				"first",
				"second",
			]);
		} finally {
			await other.close();
		}
	});
});

describe("MCP HTTP handling", () => {
	test("supports CORS preflight for any browser client", async () => {
		const response = await mcpResponse(
			new Request(endpoint, {
				method: "OPTIONS",
				headers: { Origin: "https://mcp-client.example" },
			}),
		);
		expect(response.status).toBe(204);
		expect(response.headers.get("access-control-allow-origin")).toBe("*");
		expect(response.headers.get("access-control-allow-methods")).toBe(
			"POST, OPTIONS",
		);
		expect(response.headers.get("access-control-allow-headers")).toContain(
			"MCP-Protocol-Version",
		);
		expect(response.headers.get("cache-control")).toBe("no-store");
	});

	test("allows complete MCP workflows from arbitrary browser origins", async () => {
		for (const origin of [
			"https://mcp-client.example",
			"http://localhost:6274",
			"null",
		]) {
			const client = await connectClient(origin);
			try {
				const { tools } = await client.listTools();
				expect(tools[0]?.name).toBe("generate_gradient");
				const result = await client.callTool({
					name: "generate_gradient",
					arguments: { seed: "portable-mcp" },
				});
				expect(result.isError).not.toBe(true);
				expect(structuredContent(result).seed).toBe("portable-mcp");
			} finally {
				await client.close();
			}
		}
	});

	test("rejects unsupported methods without opening an SSE stream", async () => {
		for (const method of ["GET", "DELETE", "PUT"]) {
			const response = await mcpResponse(new Request(endpoint, { method }));
			expect(response.status).toBe(405);
			expect(response.headers.get("allow")).toBe("POST, OPTIONS");
		}
	});

	test("rejects malformed JSON, unsupported protocol versions, and oversized bodies", async () => {
		expect((await post("not json")).status).toBe(400);
		expect(
			(
				await post(
					JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
					{ "MCP-Protocol-Version": "1900-01-01" },
				)
			).status,
		).toBe(400);
		expect((await post(" ".repeat(16 * 1024 + 1))).status).toBe(413);
	});
});
