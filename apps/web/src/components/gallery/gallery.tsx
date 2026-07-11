import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { GradientItem } from "#/lib/gradients.ts";
import { cn } from "#/lib/utils.ts";
import { useGallery } from "./context.ts";
import { GalleryToolbar } from "./toolbar.tsx";

function GalleryHeader({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<header
			className={cn(
				"flex flex-wrap items-center justify-between px-0.5 pb-2",
				className,
			)}
		>
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

function GalleryGrid({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-6",
				className,
			)}
		>
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
			variant="ghost"
			size="xs"
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
	Toolbar: GalleryToolbar,
	Grid: GalleryGrid,
	Items: GalleryItems,
	Sentinel: GallerySentinel,
	Footer: GalleryFooter,
	LoadMore: GalleryLoadMore,
};
