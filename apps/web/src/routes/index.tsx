import { seedHash } from "@meshy/core";
import { MeshyGradient } from "@meshy/react";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { LRUCache } from "lru-cache";

const PAGE_SIZE = 50;

const SPANS = [20, 26, 32, 38, 46] as const;

interface CardItem {
	seed: string;
	span: number;
}

function spanForSeed(seed: string): number {
	const n = Number.parseInt(seedHash(seed).slice(0, 6), 36);
	return SPANS[n % SPANS.length] as number;
}

const pageCache = new LRUCache<number, CardItem[]>({ max: 100 });

const getGradientsPage = createServerFn({ method: "GET" })
	.inputValidator((page: number) => {
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
		const items = Array.from({ length: PAGE_SIZE }, (_, i) => {
			const seed = seedHash(page * PAGE_SIZE + i);
			return { seed, span: spanForSeed(seed) };
		});
		pageCache.set(page, items);
		return items;
	});

const gradientsQuery = infiniteQueryOptions({
	queryKey: ["gradients"],
	queryFn: ({ pageParam }) => getGradientsPage({ data: pageParam }),
	initialPageParam: 0,
	getNextPageParam: (_last: CardItem[], pages: CardItem[][]) => pages.length,
	staleTime: Number.POSITIVE_INFINITY,
});

export const Route = createFileRoute("/")({
	component: PreviewPage,
	loader: ({ context }) =>
		context.queryClient.prefetchInfiniteQuery(gradientsQuery),
});

function PreviewPage() {
	const { data, fetchNextPage, isFetchingNextPage } =
		useInfiniteQuery(gradientsQuery);

	const observeSentinel = (el: HTMLDivElement | null) => {
		if (!el) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					fetchNextPage({ cancelRefetch: false });
				}
			},
			{ rootMargin: "0px 0px 100% 0px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	};

	const items = data?.pages.flat() ?? [];

	return (
		<main className="w-full px-2 py-3">
			<header className="flex items-baseline justify-between px-0.5 pb-2">
				<h1 className="text-xs font-semibold tracking-tight">meshy</h1>
				<p className="text-[10px] tabular-nums text-muted-foreground">
					{items.length} gradients
				</p>
			</header>

			<div
				className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
				style={{ gridAutoRows: "4px" }}
			>
				{items.map((item) => (
					<GradientCard key={item.seed} item={item} />
				))}
			</div>

			<div ref={observeSentinel} className="h-px" />

			<div className="flex items-center justify-center py-4">
				{isFetchingNextPage ? (
					<span className="size-3.5 animate-spin rounded-full border border-muted-foreground/40 border-t-foreground" />
				) : (
					<span className="text-[10px] text-muted-foreground">
						scroll for more
					</span>
				)}
			</div>
		</main>
	);
}

function GradientCard({ item }: { item: CardItem }) {
	return (
		<figure
			className="group relative m-0 overflow-hidden rounded-sm"
			style={{ gridRowEnd: `span ${item.span}` }}
		>
			<MeshyGradient
				seed={item.seed}
				title={item.seed}
				className="absolute inset-0"
			/>
			<figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-medium leading-none text-white/90 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
				{item.seed}
			</figcaption>
		</figure>
	);
}
