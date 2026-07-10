import { getRouteApi } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button.tsx";
import { Slider } from "#/components/ui/slider.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { playToggle } from "#/lib/click-sound.ts";
import {
	DEFAULT_GALLERY_OPTIONS,
	type GalleryOptions,
	isDefaultGalleryOptions,
	LAYOUTS,
	MAX_COLORS,
	MIN_COLORS,
	ROUNDED,
	resolveGalleryOptions,
	toGallerySearch,
} from "#/lib/gallery-options.ts";

const route = getRouteApi("/");

export function GalleryToolbar() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const options = resolveGalleryOptions(search);

	const update = (patch: Partial<GalleryOptions>) => {
		navigate({
			search: toGallerySearch({ ...options, ...patch }),
			replace: true,
			resetScroll: false,
		});
	};

	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
			<Control label="colors">
				<Slider
					value={[options.colors]}
					min={MIN_COLORS}
					max={MAX_COLORS}
					step={1}
					onValueChange={([colors]) => {
						if (colors !== undefined && colors !== options.colors) {
							playToggle();
							update({ colors });
						}
					}}
					className="w-20"
					aria-label="Number of colors"
				/>
				<span className="w-3 text-right text-[11px] text-muted-foreground tabular-nums">
					{options.colors}
				</span>
			</Control>

			<Separator />

			<Control label="layout">
				<ToggleGroup
					type="single"
					size="xs"
					value={options.layout}
					onValueChange={(layout) => {
						if (layout) {
							playToggle();
							update({ layout: layout as GalleryOptions["layout"] });
						}
					}}
					aria-label="Blob layout"
				>
					{LAYOUTS.map((layout) => (
						<ToggleGroupItem key={layout} value={layout}>
							{layout}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</Control>

			<Separator />

			<Control label="rounded">
				<ToggleGroup
					type="single"
					size="xs"
					value={options.rounded}
					onValueChange={(rounded) => {
						if (rounded) {
							playToggle();
							update({ rounded: rounded as GalleryOptions["rounded"] });
						}
					}}
					aria-label="Corner radius"
				>
					{ROUNDED.map((rounded) => (
						<ToggleGroupItem key={rounded} value={rounded}>
							{rounded}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</Control>

			<Button
				variant="ghost"
				size="xs"
				sound="toggle"
				aria-label="Reset options"
				disabled={isDefaultGalleryOptions(options)}
				className="text-muted-foreground disabled:opacity-30"
				onClick={() => update(DEFAULT_GALLERY_OPTIONS)}
			>
				<RotateCcw />
				reset
			</Button>
		</div>
	);
}

function Control({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-[11px] text-muted-foreground leading-none">
				{label}
			</span>
			{children}
		</div>
	);
}

function Separator() {
	return <div aria-hidden className="hidden h-4 w-px bg-border sm:block" />;
}
