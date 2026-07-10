import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CustomSeedCard } from "#/components/custom-seed-card.tsx";
import { Gallery } from "#/components/gallery/gallery.tsx";
import { GradientsProvider } from "#/components/gallery/provider.tsx";
import { GradientCard } from "#/components/gradient-card.tsx";
import { Hero } from "#/components/hero.tsx";
import { gradientsQuery } from "#/lib/gradients.ts";

export const Route = createFileRoute("/")({
	component: PreviewPage,
	loader: async ({ context }) => {
		await context.queryClient.prefetchInfiniteQuery(gradientsQuery);
	},
});

function FadeIn({
	delay = 0,
	children,
}: {
	delay?: number;
	children: ReactNode;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, filter: "blur(4px)" }}
			animate={{ opacity: 1, filter: "blur(0px)" }}
			transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
		>
			{children}
		</motion.div>
	);
}

function PreviewPage() {
	return (
		<GradientsProvider>
			<main className="w-full p-3">
				<FadeIn>
					<Hero />
				</FadeIn>

				<FadeIn delay={0.1}>
					<Gallery.Header>
						<Gallery.Count />
					</Gallery.Header>
				</FadeIn>

				<FadeIn delay={0.15}>
					<Gallery.Grid>
						<CustomSeedCard />
						<Gallery.Items>
							{(item, index) => (
								<GradientCard key={item.seed} seed={item.seed} index={index} />
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
