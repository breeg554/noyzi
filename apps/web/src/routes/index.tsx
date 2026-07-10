import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/")({
	component: PreviewPage,
	validateSearch: parseGallerySearch,
	loader: async ({ context }) => {
		await context.queryClient.prefetchInfiniteQuery(gradientsQuery);
	},
});

function PreviewPage() {
	const search = Route.useSearch();
	const options = resolveGalleryOptions(search);

	return (
		<GradientsProvider>
			<main className="w-full p-3">
				<FadeIn>
					<Hero />
				</FadeIn>

				{/* Backdrop layers extend up behind the site header (-top-14) so
				    header + toolbar share one continuous background that only
				    fades out below the toolbar. */}
				<div className="sticky top-14 z-40 -mx-3">
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 backdrop-blur-lg [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
					/>
					<div
						aria-hidden
						className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 bg-linear-to-b from-background/70 via-background/40 to-transparent"
					/>
					<Gallery.Header className="relative px-3.5 py-2">
						<Gallery.Count />
						<Gallery.Toolbar />
					</Gallery.Header>
				</div>

				<FadeIn delay={0.15}>
					<Gallery.Grid>
						<CustomSeedCard options={options} />
						<Gallery.Items>
							{(item, index) => (
								<GradientCard
									key={item.seed}
									seed={item.seed}
									index={index}
									options={options}
								/>
							)}
						</Gallery.Items>
					</Gallery.Grid>
				</FadeIn>

				<Gallery.Sentinel />

				<FadeIn delay={0.2}>
					<Gallery.Footer>
						<Gallery.LoadMore>Load more</Gallery.LoadMore>
					</Gallery.Footer>
				</FadeIn>
			</main>
		</GradientsProvider>
	);
}
