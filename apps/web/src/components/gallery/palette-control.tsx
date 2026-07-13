import type { HexColor } from "@noyzi/core";
import { Check, Minus, Palette, Plus, Sparkles } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "#/components/ui/popover.tsx";
import type { GalleryOptions } from "#/lib/gallery-options.ts";

const CUSTOM_PALETTE = [
	"#f5eee0",
	"#8fb9be",
	"#ebdac3",
	"#b9a7c7",
	"#d6a88f",
	"#9eb8a5",
	"#d8c99b",
	"#aebed2",
] as const satisfies readonly HexColor[];

const PALETTE_SLOTS = [
	"background",
	"accent-1",
	"accent-2",
	"accent-3",
	"accent-4",
	"accent-5",
	"accent-6",
	"accent-7",
] as const;

const PALETTE_UPDATE_DELAY = 120;

export function PaletteControl({
	options,
	update,
}: {
	options: GalleryOptions;
	update: (patch: Partial<GalleryOptions>) => void;
}) {
	const externalPaletteKey = options.palette?.join(",") ?? "";
	const [palette, setDraftPalette] = useState<readonly HexColor[]>(
		() => options.palette ?? CUSTOM_PALETTE.slice(0, 4),
	);
	const [isCustom, setIsCustom] = useState(options.palette !== null);
	const pendingPaletteKey = useRef<string | null>(null);
	const updateRef = useRef(update);
	const paletteKey = isCustom ? palette.join(",") : "";

	useEffect(() => {
		updateRef.current = update;
	}, [update]);

	useEffect(() => {
		if (pendingPaletteKey.current === externalPaletteKey) {
			pendingPaletteKey.current = null;
			return;
		}
		if (pendingPaletteKey.current !== null) return;
		setDraftPalette(
			externalPaletteKey
				? (externalPaletteKey.split(",") as HexColor[])
				: CUSTOM_PALETTE.slice(0, 4),
		);
		setIsCustom(externalPaletteKey !== "");
	}, [externalPaletteKey]);

	useEffect(() => {
		if (paletteKey === externalPaletteKey) {
			pendingPaletteKey.current = null;
			return;
		}

		pendingPaletteKey.current = paletteKey;
		const timeout = window.setTimeout(() => {
			const nextPalette = isCustom ? palette : null;
			startTransition(() => {
				updateRef.current({ palette: nextPalette });
			});
		}, PALETTE_UPDATE_DELAY);

		return () => window.clearTimeout(timeout);
	}, [externalPaletteKey, isCustom, palette, paletteKey]);

	const setPalette = (next: readonly HexColor[]) => {
		setDraftPalette(next);
		setIsCustom(true);
	};

	const useSeededPalette = () => setIsCustom(false);

	const updateColor = (index: number, color: HexColor) => {
		setPalette(
			palette.map((current, currentIndex) =>
				currentIndex === index ? color : current,
			),
		);
	};

	const addColor = () => {
		const color = CUSTOM_PALETTE[palette.length];
		if (color) setPalette([...palette, color]);
	};

	const removeColor = () => {
		if (palette.length > 2) setPalette(palette.slice(0, -1));
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="xs"
					sound="boop"
					aria-label={isCustom ? "Edit custom palette" : "Choose palette"}
					className="h-6 gap-1.5 px-1.5 font-normal text-muted-foreground data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground"
				>
					{isCustom ? (
						<>
							<span aria-hidden className="flex -space-x-1">
								{PALETTE_SLOTS.slice(0, 4).map((slot, index) => {
									const color = palette[index];
									return color ? (
										<span
											key={slot}
											className="size-3 rounded-full ring-1 ring-background"
											style={{ backgroundColor: color }}
										/>
									) : null;
								})}
							</span>
							<span className="text-[10px] tabular-nums">{palette.length}</span>
						</>
					) : (
						<>
							<Palette />
							seeded
						</>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent align="end" sideOffset={8} className="w-64 p-3">
				<PopoverHeader className="gap-0.5">
					<div className="flex items-start justify-between gap-3">
						<div>
							<PopoverTitle className="text-xs">Palette</PopoverTitle>
							<PopoverDescription className="mt-1 text-[10px] leading-relaxed">
								One palette across every seed.
							</PopoverDescription>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="xs"
							sound="boop"
							onClick={useSeededPalette}
							className="h-6 gap-1 px-1.5 font-normal text-[10px] text-muted-foreground"
						>
							{isCustom ? <Sparkles /> : <Check />}
							seeded
						</Button>
					</div>
				</PopoverHeader>

				<div className="my-3 h-px bg-border/70" />

				<div className="grid grid-cols-2 gap-2">
					{PALETTE_SLOTS.slice(0, palette.length).map((slot, index) => {
						const color = palette[index];
						if (!color) return null;
						return (
							<label key={slot} className="min-w-0">
								<span className="mb-1 block font-mono text-[8px] text-muted-foreground uppercase tracking-wider">
									{index === 0 ? "background" : `accent ${index}`}
								</span>
								<span className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/60 px-1.5 transition-colors hover:border-foreground/20">
									<input
										type="color"
										name={`palette-${slot}`}
										value={color}
										onChange={(event) =>
											updateColor(index, event.target.value as HexColor)
										}
										aria-label={`${index === 0 ? "Background" : `Accent ${index}`} color`}
										className="size-5 shrink-0 cursor-pointer overflow-hidden rounded-sm border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
									/>
									<span className="truncate font-mono text-[9px] text-muted-foreground">
										{color}
									</span>
								</span>
							</label>
						);
					})}
				</div>

				<div className="mt-3 flex items-center justify-between border-border/70 border-t pt-3">
					{isCustom ? (
						<span className="font-mono text-[9px] text-muted-foreground">
							{palette.length} colors
						</span>
					) : (
						<Button
							type="button"
							variant="outline"
							size="xs"
							sound="boop"
							onClick={() => setPalette([...palette])}
							className="h-6 border-border/60 bg-transparent px-2 font-normal text-[10px] shadow-none"
						>
							use palette
						</Button>
					)}
					<div className="flex gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							sound="boop"
							onClick={removeColor}
							disabled={palette.length <= 2}
							aria-label="Remove last palette color"
							className="text-muted-foreground"
						>
							<Minus />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							sound="boop"
							onClick={addColor}
							disabled={palette.length >= 8}
							aria-label="Add palette color"
							className="text-muted-foreground"
						>
							<Plus />
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
