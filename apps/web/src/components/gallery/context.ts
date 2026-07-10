import { createContext, use } from "react";
import type { GradientItem } from "#/lib/gradients.ts";

export interface GalleryState {
	items: GradientItem[];
	hasMore: boolean;
	isLoadingMore: boolean;
}

export interface GalleryActions {
	loadMore: () => void;
}

export interface GalleryContextValue {
	state: GalleryState;
	actions: GalleryActions;
}

export const GalleryContext = createContext<GalleryContextValue | null>(null);

export function useGallery(): GalleryContextValue {
	const value = use(GalleryContext);
	if (value === null) {
		throw new Error("Gallery components must be rendered inside a provider");
	}
	return value;
}
