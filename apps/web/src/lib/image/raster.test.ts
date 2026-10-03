import { describe, expect, test } from "bun:test";
import { generate, toPixels } from "@noyzi/core";
import {
	encodeRaster,
	MAX_ACTIVE_RENDERS,
	MAX_WAITING_RENDERS,
	RasterBusyError,
} from "./raster.ts";

describe("raster queue", () => {
	test("rejects renders once the queue is full", async () => {
		const render = () => toPixels(generate("busy"), { width: 8, height: 8 });
		const results = await Promise.allSettled(
			Array.from({ length: MAX_ACTIVE_RENDERS + MAX_WAITING_RENDERS + 3 }, () =>
				encodeRaster(render, "png"),
			),
		);
		const busy = results.filter(
			(result) => result.status === "rejected" && result.reason instanceof RasterBusyError,
		);
		expect(busy.length).toBe(3);
		expect(results.filter((result) => result.status === "fulfilled").length).toBe(
			MAX_ACTIVE_RENDERS + MAX_WAITING_RENDERS,
		);
		expect((await encodeRaster(render, "jpg")).length).toBeGreaterThan(0);
	});
});
