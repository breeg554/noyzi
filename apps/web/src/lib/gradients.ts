import { seedHash } from "@noyzi/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { LRUCache } from "lru-cache";

export const PAGE_SIZE = 50;

export interface GradientItem {
	seed: string;
}

const pageCache = new LRUCache<number, GradientItem[]>({ max: 100 });

const getGradientsPage = createServerFn({ method: "GET" })
	.validator((page: number) => {
		if (!Number.isInteger(page) || page < 0) {
			throw new Error(`Invalid page: ${page}`);
		}
		return page;
	})
	.handler(({ data: page }) => {
		setResponseHeader("Cache-Control", "public, max-age=31536000, immutable");
		const cached = pageCache.get(page);
		if (cached) {
			return cached;
		}
		const items = Array.from({ length: PAGE_SIZE }, (_, i) => ({
			seed: seedHash(`noyzi:${page * PAGE_SIZE + i}`),
		}));
		pageCache.set(page, items);
		return items;
	});

export const gradientsQuery = infiniteQueryOptions({
	queryKey: ["gradients"],
	queryFn: async ({ pageParam }) => getGradientsPage({ data: pageParam }),
	initialPageParam: 0,
	getNextPageParam: (
		_last: GradientItem[],
		_pages: GradientItem[][],
		lastPageParam: number,
	) => lastPageParam + 1,
	staleTime: Number.POSITIVE_INFINITY,
});
