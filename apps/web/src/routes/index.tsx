import { createFileRoute } from "@tanstack/react-router";
import { CustomSeedCard } from "#/components/custom-seed-card.tsx";
import { Gallery } from "#/components/gallery/gallery.tsx";
import { GradientsProvider } from "#/components/gallery/provider.tsx";
import { GradientCard } from "#/components/gradient-card.tsx";
import { gradientsQuery } from "#/lib/gradients.ts";

export const Route = createFileRoute("/")({
	component: PreviewPage,
	loader: async ({ context }) => {
		await context.queryClient.prefetchInfiniteQuery(gradientsQuery);
	},
});

function PreviewPage() {
	return (
		<GradientsProvider>
			<main className="w-full p-3">
				<Gallery.Header>
					<Gallery.Count />
				</Gallery.Header>

				<Gallery.Grid>
					<CustomSeedCard />
					<Gallery.Items>
						{(item, index) => (
							<GradientCard key={item.seed} seed={item.seed} index={index} />
						)}
					</Gallery.Items>
					<Gallery.LoadingCards />
				</Gallery.Grid>

				<Gallery.Sentinel />

				<Gallery.Footer>
					<Gallery.LoadMore>Load more</Gallery.LoadMore>
				</Gallery.Footer>
			</main>
		</GradientsProvider>
	);
}
