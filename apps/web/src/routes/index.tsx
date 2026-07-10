import { seedHash } from "@meshy/core";
import { MeshyGradient } from "@meshy/react";
import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { LRUCache } from "lru-cache";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const PAGE_SIZE = 50;
const AVATAR_SIZE = 96;

interface CardItem {
	seed: string;
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
		const items = Array.from({ length: PAGE_SIZE }, (_, i) => ({
			seed: seedHash(page * PAGE_SIZE + i),
		}));
		pageCache.set(page, items);
		return items;
	});

const gradientsQuery = infiniteQueryOptions({
	queryKey: ["gradients"],
	queryFn: async ({ pageParam }) => getGradientsPage({ data: pageParam }),
	initialPageParam: 0,
	getNextPageParam: (
		_last: CardItem[],
		_pages: CardItem[][],
		lastPageParam: number,
	) => lastPageParam + 1,
	staleTime: Number.POSITIVE_INFINITY,
});

export const Route = createFileRoute("/")({
	component: PreviewPage,
	loader: async ({ context }) => {
		await context.queryClient.prefetchInfiniteQuery(gradientsQuery);
	},
});

function PreviewPage() {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(gradientsQuery);

	const { ref, inView } = useInView({ rootMargin: "0px 0px 100% 0px" });

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const pages = data?.pages ?? [];
	const total = pages.reduce((n, page) => n + page.length, 0);

	return (
		<main className="w-full px-2 py-3">
			<header className="flex items-baseline justify-between px-0.5 pb-2">
				<h1 className="text-xs font-semibold tracking-tight">meshy</h1>
				<p className="text-[10px] tabular-nums text-muted-foreground">
					{total} gradients
				</p>
			</header>

			<div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{pages.map((page, pageIndex) =>
					page.map((item, index) => (
						<GradientCard
							key={item.seed}
							item={item}
							index={index}
							animated={pageIndex > 0}
						/>
					)),
				)}
			</div>

			<div ref={ref} className="h-px" />

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

function GradientCard({
	item,
	index,
	animated,
}: {
	item: CardItem;
	index: number;
	animated: boolean;
}) {
	return (
		<motion.figure
			initial={animated ? { opacity: 0, y: 8, filter: "blur(4px)" } : false}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{
				duration: 0.3,
				ease: [0.16, 1, 0.3, 1],
				delay: index * 0.012,
			}}
			className="group m-0 flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card p-2 transition-colors duration-200 hover:border-border hover:bg-muted"
		>
			<MeshyGradient
				seed={item.seed}
				size={AVATAR_SIZE}
				rounded="full"
				title={item.seed}
				className="transition-transform duration-200 ease-out group-hover:scale-110"
			/>
			<figcaption className="w-full truncate text-center text-[10px] leading-none text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
				{item.seed}
			</figcaption>
		</motion.figure>
	);
}
