import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Skeleton } from "#/components/ui/skeleton.tsx";
import type { GradientItem } from "#/lib/gradients.ts";
import { useGallery } from "./context.ts";

function GalleryHeader({ children }: { children: ReactNode }) {
	return (
		<header className="flex items-baseline justify-between px-0.5 pb-2">
			{children}
		</header>
	);
}

function GalleryTitle({ children }: { children: ReactNode }) {
	return <h1 className="text-xs font-semibold tracking-tight">{children}</h1>;
}

function GalleryCount() {
	const { state } = useGallery();
	return (
		<Badge variant="secondary" className="tabular-nums">
			{state.items.length} gradients
		</Badge>
	);
}

function GalleryGrid({ children }: { children: ReactNode }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 min-[1900px]:grid-cols-6">
			{children}
		</div>
	);
}

function GalleryItems({
	children,
}: {
	children: (item: GradientItem, index: number) => ReactNode;
}) {
	const { state } = useGallery();
	return state.items.map((item, index) => children(item, index));
}

const PLACEHOLDER_IDS = [
	"ph-a",
	"ph-b",
	"ph-c",
	"ph-d",
	"ph-e",
	"ph-f",
	"ph-g",
	"ph-h",
	"ph-i",
	"ph-j",
	"ph-k",
	"ph-l",
];

function GalleryLoadingCards({ count = 6 }: { count?: number }) {
	const { state } = useGallery();
	if (!state.isLoadingMore) {
		return null;
	}
	return PLACEHOLDER_IDS.slice(0, count).map((id) => (
		<div
			key={id}
			className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md bg-card p-2"
		>
			<Skeleton className="size-24 rounded-full" />
			<Skeleton className="h-2.5 w-16" />
		</div>
	));
}

function GallerySentinel() {
	const { actions } = useGallery();
	const { ref, inView } = useInView({ rootMargin: "0px 0px 100% 0px" });

	useEffect(() => {
		if (inView) {
			actions.loadMore();
		}
	}, [inView, actions]);

	return <div ref={ref} className="h-px" />;
}

function GalleryFooter({ children }: { children: ReactNode }) {
	return (
		<div className="flex items-center justify-center py-4">{children}</div>
	);
}

function GalleryLoadMore({ children }: { children: ReactNode }) {
	const { state, actions } = useGallery();
	return (
		<Button
			variant="outline"
			size="sm"
			disabled={!state.hasMore || state.isLoadingMore}
			onClick={actions.loadMore}
		>
			{state.isLoadingMore && <Loader2 className="animate-spin" />}
			{children}
		</Button>
	);
}

export const Gallery = {
	Header: GalleryHeader,
	Title: GalleryTitle,
	Count: GalleryCount,
	Grid: GalleryGrid,
	Items: GalleryItems,
	LoadingCards: GalleryLoadingCards,
	Sentinel: GallerySentinel,
	Footer: GalleryFooter,
	LoadMore: GalleryLoadMore,
};
