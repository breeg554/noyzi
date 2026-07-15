import { NoyziAnimatedGroup } from "@noyzi/react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useDeferredValue, useMemo } from "react";
import { CustomSeedCard } from "#/components/custom-seed-card.tsx";
import { FadeIn } from "#/components/fade-in.tsx";
import { Gallery } from "#/components/gallery/gallery.tsx";
import { GradientsProvider } from "#/components/gallery/provider.tsx";
import { GradientCard } from "#/components/gradient-card.tsx";
import { Hero } from "#/components/hero.tsx";
import {
	parseGallerySearch,
	resolveGalleryOptions,
} from "#/lib/gallery-options.ts";
import { gradientsQuery } from "#/lib/gradients.ts";
import { createMeta } from "#/lib/meta.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/")({
	component: PreviewPage,
	validateSearch: parseGallerySearch,
	head: () =>
		createMeta({
			title: "Noyzi — Gradients from any seed",
			path: "/",
		}),
	loader: async ({ context }) => {
		await context.queryClient.prefetchInfiniteQuery(gradientsQuery);
	},
});

function PreviewPage() {
	const search = Route.useSearch();
	const options = useMemo(() => resolveGalleryOptions(search), [search]);
	const deferredOptions = useDeferredValue(options);
	const isStale = options !== deferredOptions;

	return (
		<GradientsProvider>
			<NoyziAnimatedGroup>
				<main className="w-full p-3">
					<FadeIn>
						<Hero />
					</FadeIn>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
						className="sticky top-14 z-40 -mx-3"
					>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 backdrop-blur-lg [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
						/>
						<div
							aria-hidden
							className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 bg-linear-to-b from-background/70 via-background/40 to-transparent"
						/>
						<Gallery.Header className="relative items-end px-3.5 pb-2">
							<Gallery.Count />
							<div className="flex flex-col items-end">
								<Gallery.Toolbar />
							</div>
						</Gallery.Header>
					</motion.div>

					<FadeIn delay={0.15}>
						<Gallery.Grid
							className={cn(
								"transition-opacity duration-200",
								isStale && "opacity-60",
							)}
							leading={<CustomSeedCard options={options} />}
						>
							{(item, index) => (
								<GradientCard
									key={item.seed}
									seed={item.seed}
									index={index}
									options={deferredOptions}
								/>
							)}
						</Gallery.Grid>
					</FadeIn>

					<Gallery.Sentinel />

					<FadeIn delay={0.2}>
						<Gallery.Footer>
							<Gallery.LoadMore>Load more</Gallery.LoadMore>
						</Gallery.Footer>
					</FadeIn>
				</main>
			</NoyziAnimatedGroup>
		</GradientsProvider>
	);
}
