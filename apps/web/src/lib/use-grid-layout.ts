import { useSyncExternalStore } from "react";

export interface GridLayout {
	columns: number;
	leadingColSpan: number;
	leadingRowSpan: number;
}

const LAYOUTS: ReadonlyArray<GridLayout & { query: string }> = [
	{
		query: "(min-width: 212rem)",
		columns: 10,
		leadingColSpan: 2,
		leadingRowSpan: 2,
	},
	{
		query: "(min-width: 170rem)",
		columns: 8,
		leadingColSpan: 2,
		leadingRowSpan: 2,
	},
	{
		query: "(min-width: 96rem)",
		columns: 6,
		leadingColSpan: 2,
		leadingRowSpan: 2,
	},
	{
		query: "(min-width: 64rem)",
		columns: 5,
		leadingColSpan: 2,
		leadingRowSpan: 2,
	},
	{
		query: "(min-width: 48rem)",
		columns: 2,
		leadingColSpan: 2,
		leadingRowSpan: 2,
	},
	{
		query: "(min-width: 40rem)",
		columns: 2,
		leadingColSpan: 2,
		leadingRowSpan: 1,
	},
];

const DEFAULT_LAYOUT: GridLayout = {
	columns: 1,
	leadingColSpan: 1,
	leadingRowSpan: 1,
};

function subscribe(onChange: () => void) {
	const lists = LAYOUTS.map(({ query }) => window.matchMedia(query));
	for (const list of lists) {
		list.addEventListener("change", onChange);
	}
	return () => {
		for (const list of lists) {
			list.removeEventListener("change", onChange);
		}
	};
}

function getSnapshot(): GridLayout {
	for (const layout of LAYOUTS) {
		if (window.matchMedia(layout.query).matches) {
			return layout;
		}
	}
	return DEFAULT_LAYOUT;
}

function getServerSnapshot(): GridLayout {
	return DEFAULT_LAYOUT;
}

export function useGridLayout(): GridLayout {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
