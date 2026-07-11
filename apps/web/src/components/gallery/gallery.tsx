import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import {
	Fragment,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
} from "react";
import { useInView } from "react-intersection-observer";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { GradientItem } from "#/lib/gradients.ts";
import { useGridLayout } from "#/lib/use-grid-layout.ts";
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

const ESTIMATED_ROW_HEIGHT = 260;

function GalleryGrid({
	className,
	leading,
	children,
}: {
	className?: string;
	leading?: ReactNode;
	children: (item: GradientItem, index: number) => ReactNode;
}) {
	const { state } = useGallery();
	const layout = useGridLayout();
	const listRef = useRef<HTMLDivElement>(null);
	const scrollMarginRef = useRef(0);

	useLayoutEffect(() => {
		const element = listRef.current;
		if (element) {
			scrollMarginRef.current =
				element.getBoundingClientRect().top + window.scrollY;
		}
	}, []);

	const { columns } = layout;
	const leadingColSpan = Math.min(layout.leadingColSpan, columns);
	const leadingRowSpan = layout.leadingRowSpan;
	const leadingBlockItems = leading
		? (columns - leadingColSpan) * leadingRowSpan
		: 0;
	const leadingRows = leading ? 1 : 0;
	const remainingItems = Math.max(0, state.items.length - leadingBlockItems);
	const rowCount = leadingRows + Math.ceil(remainingItems / columns);

	const virtualizer = useWindowVirtualizer({
		count: rowCount,
		estimateSize: (index) =>
			(leading && index === 0 ? leadingRowSpan : 1) * ESTIMATED_ROW_HEIGHT,
		overscan: 3,
		scrollMargin: scrollMarginRef.current,
		initialRect: { width: 0, height: 1080 },
	});

	useEffect(() => {
		virtualizer.measure();
	}, [layout, virtualizer]);

	const renderItem = (itemIndex: number) => {
		const item = state.items[itemIndex];
		if (!item) {
			return null;
		}
		return <Fragment key={item.seed}>{children(item, itemIndex)}</Fragment>;
	};

	return (
		<div
			ref={listRef}
			className={cn("relative w-full", className)}
			style={{ height: virtualizer.getTotalSize() }}
		>
			{virtualizer.getVirtualItems().map((row) => {
				const isLeadingRow = Boolean(leading) && row.index === 0;
				const rowStart = isLeadingRow
					? 0
					: leadingBlockItems + (row.index - leadingRows) * columns;
				const rowLength = isLeadingRow ? leadingBlockItems : columns;
				return (
					<div
						key={row.key}
						data-index={row.index}
						ref={virtualizer.measureElement}
						className="absolute inset-x-0 top-0 grid grid-cols-1 gap-3 pb-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-6"
						style={{
							transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
						}}
					>
						{isLeadingRow && leading}
						{Array.from({ length: rowLength }, (_, column) =>
							renderItem(rowStart + column),
						)}
					</div>
				);
			})}
		</div>
	);
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
	Sentinel: GallerySentinel,
	Footer: GalleryFooter,
	LoadMore: GalleryLoadMore,
};
