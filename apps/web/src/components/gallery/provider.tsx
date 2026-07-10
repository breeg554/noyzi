import { useInfiniteQuery } from "@tanstack/react-query";
import { type ReactNode, useMemo } from "react";
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
						fetchNextPage();
					}
				},
			},
		}),
		[items, hasNextPage, isFetchingNextPage, fetchNextPage],
	);

	return <GalleryContext value={value}>{children}</GalleryContext>;
}
