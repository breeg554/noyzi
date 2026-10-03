import { useInfiniteQuery } from "@tanstack/react-query";
import { type ReactNode, useMemo } from "react";
import { analytics } from "#/lib/analytics.ts";
import { gradientsQuery } from "#/lib/gradients.ts";
import { GalleryContext, type GalleryContextValue } from "./context.ts";

export function GradientsProvider({
	children,
}: {
	children: ReactNode;
}): ReactNode {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(gradientsQuery);

	const items = useMemo(() => (data?.pages ?? []).flat(), [data]);

	const value = useMemo<GalleryContextValue>(
		() => ({
			state: {
				items,
				hasMore: hasNextPage,
				isLoadingMore: isFetchingNextPage,
			},
			actions: {
				loadMore: () => {
					if (hasNextPage && !isFetchingNextPage) {
						void fetchNextPage().then((result) => {
							if (result.isError || !result.data) return;
							analytics.galleryMoreLoaded(
								result.data.pages.length - 1,
								result.data.pages.at(-1)?.length ?? 0,
							);
						});
					}
				},
			},
		}),
		[items, hasNextPage, isFetchingNextPage, fetchNextPage],
	);

	return <GalleryContext value={value}>{children}</GalleryContext>;
}
