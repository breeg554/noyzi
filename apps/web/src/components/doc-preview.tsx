import {
	type GenerateOptions,
	type HexColor,
	paletteFromSeed,
} from "@noyzi/core";
import { NoyziGradient } from "@noyzi/react";
import { Minus, Plus } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { showGradientCopyToast } from "#/components/gradient-card.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { playClick } from "#/lib/click-sound.ts";
import type { DocPreviewKind } from "#/lib/docs.ts";

const DEFAULT_SEED = "ada";
const GENERATE_PALETTE = [
	"#f5eee0",
	"#8fb9be",
	"#ebdac3",
	"#b9a7c7",
	"#d6a88f",
	"#9eb8a5",
	"#d8c99b",
	"#aebed2",
] as const satisfies readonly HexColor[];

interface PaletteEntry {
	color: HexColor;
	id: string;
}

function compactNumber(value: number): string {
	return String(value).replace(/^0\./, ".");
}

const GRADIENT_AVATARS = [
	{ id: "clean", options: { colors: 3, vignette: false } },
	{ id: "soft", options: { colors: 5, vignette: { strength: 0.12 } } },
	{
		id: "balanced",
		options: { colors: 6, vignette: { strength: 0.18 } },
	},
	{ id: "bright", options: { colors: 4, vignette: false } },
	{ id: "moody", options: { colors: 7, vignette: { strength: 0.32 } } },
] as const satisfies readonly { id: string; options: GenerateOptions }[];

function gradientSnippet(
	seed: string,
	variant: (typeof GRADIENT_AVATARS)[number],
) {
	const { colors, vignette } = variant.options;
	const vignetteValue =
		vignette === false ? "false" : `{ strength: ${vignette?.strength ?? 0} }`;
	return `<NoyziGradient
  seed=${JSON.stringify(seed)}
  options={{ colors: ${colors}, vignette: ${vignetteValue} }}
  className="size-20 rounded-full"
/>`;
}

export function DocPreview({
	kind,
	className,
}: {
	kind: DocPreviewKind;
	className?: string;
}) {
	const [seed, setSeed] = useState("");
	const activeSeed = useDeferredValue(seed.trim() || DEFAULT_SEED);

	if (kind === "generate") {
		return <GeneratePalettePreview className={className} />;
	}

	if (kind === "gradient") {
		return (
			<div className={`space-y-2 ${className ?? ""}`}>
				<div className="space-y-4 rounded-xl border border-border/60 bg-muted/15 px-4 py-5">
					<p className="text-center text-[11px] text-muted-foreground">
						Select an avatar to copy its exact component.
					</p>
					<div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-5 sm:gap-x-4">
						{GRADIENT_AVATARS.map((variant) => (
							<GradientAvatarPreview
								key={variant.id}
								variant={variant}
								seed={activeSeed}
							/>
						))}
					</div>
					<GradientOptionsGuide />
				</div>
				<Input
					value={seed}
					onChange={(event) => setSeed(event.target.value)}
					placeholder={DEFAULT_SEED}
					aria-label="Gradient preview seed"
					className="ml-auto h-8 w-32 border-border/60 bg-transparent text-center font-mono text-[11px] text-muted-foreground shadow-none placeholder:text-muted-foreground/60 md:text-[11px] dark:bg-transparent"
				/>
			</div>
		);
	}

	return (
		<PalettePreview
			seed={seed}
			activeSeed={activeSeed}
			setSeed={setSeed}
			className={className}
		/>
	);
}

function GeneratePalettePreview({ className }: { className?: string }) {
	const [seed, setSeed] = useState("");
	const [palette, setPalette] = useState<PaletteEntry[]>(() =>
		GENERATE_PALETTE.slice(0, 3).map((color, index) => ({
			color,
			id: `color-${index}`,
		})),
	);
	const activeSeed = useDeferredValue(seed.trim() || DEFAULT_SEED);
	const previewPalette = useDeferredValue(palette.map((entry) => entry.color));

	const updateColor = (id: string, color: HexColor) => {
		setPalette((current) =>
			current.map((entry) => (entry.id === id ? { ...entry, color } : entry)),
		);
	};

	const addColor = () => {
		setPalette((current) => {
			const color = GENERATE_PALETTE[current.length];
			return color
				? [...current, { color, id: `color-${current.length}` }]
				: current;
		});
	};

	const removeColor = () => {
		setPalette((current) =>
			current.length > 2 ? current.slice(0, -1) : current,
		);
	};

	return (
		<div
			className={`grid gap-4 rounded-xl border border-border/60 bg-muted/15 p-4 sm:grid-cols-[minmax(0,1fr)_11rem] ${className ?? ""}`}
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="font-medium text-sm">Try a palette</p>
						<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
							The first color becomes the background.
						</p>
					</div>
					<div className="flex shrink-0 gap-1">
						<Input
							value={seed}
							onChange={(event) => setSeed(event.target.value)}
							placeholder="seed: ada"
							aria-label="Custom palette preview seed"
							className="h-6 w-24 border-border/60 bg-background/60 px-2 font-mono text-[10px] text-muted-foreground shadow-none placeholder:text-muted-foreground/60 md:text-[10px] dark:bg-background/60"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
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
							onClick={addColor}
							disabled={palette.length >= 8}
							aria-label="Add palette color"
							className="text-muted-foreground"
						>
							<Plus />
						</Button>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					{palette.map((entry, index) => (
						<label key={entry.id} className="min-w-28 flex-1 sm:max-w-36">
							<span className="mb-1 block font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
								{index === 0 ? "background" : `accent ${index}`}
							</span>
							<span className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/60 px-1.5 transition-colors hover:border-foreground/20">
								<input
									type="color"
									value={entry.color}
									onChange={(event) =>
										updateColor(entry.id, event.target.value as HexColor)
									}
									aria-label={`${index === 0 ? "Background" : `Accent ${index}`} color`}
									className="size-6 shrink-0 cursor-pointer overflow-hidden rounded-sm border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
								/>
								<span className="truncate font-mono text-[10px] text-muted-foreground">
									{entry.color}
								</span>
							</span>
						</label>
					))}
				</div>
			</div>

			<div className="relative min-h-32 overflow-hidden rounded-lg bg-muted">
				<NoyziGradient
					seed={activeSeed}
					options={{ palette: previewPalette }}
					aria-label="Custom palette gradient preview"
					className="absolute inset-0 shadow-none ring-1 ring-black/10 dark:ring-white/10"
				/>
				<span className="absolute right-2 bottom-2 rounded-sm bg-black/35 px-1.5 py-0.5 font-mono text-[9px] text-white/80 backdrop-blur-sm">
					{activeSeed} · {palette.length} colors
				</span>
			</div>
		</div>
	);
}

function GradientAvatarPreview({
	variant,
	seed,
}: {
	variant: (typeof GRADIENT_AVATARS)[number];
	seed: string;
}) {
	const copy = async () => {
		playClick();
		showGradientCopyToast(seed, variant.options);
		await navigator.clipboard.writeText(gradientSnippet(seed, variant));
	};
	const vignette = variant.options.vignette;

	return (
		<div className="flex min-w-0 flex-col items-center gap-2">
			<button
				type="button"
				onClick={copy}
				aria-label={`Copy ${variant.id} gradient component`}
				className="cursor-copy rounded-full transition-transform duration-300 ease-out hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				<NoyziGradient
					seed={seed}
					options={variant.options}
					aria-hidden="true"
					className="size-16 rounded-full shadow-none ring-1 ring-black/10 sm:size-20 dark:ring-white/10"
				/>
			</button>
			<div className="text-center font-mono text-[9px] text-muted-foreground leading-4 tabular-nums">
				<p>c {variant.options.colors}</p>
				<p>
					v{" "}
					{vignette === false ? "off" : compactNumber(vignette?.strength ?? 0)}
				</p>
			</div>
		</div>
	);
}

function GradientOptionsGuide() {
	return (
		<dl className="grid gap-x-6 gap-y-3 border-border/60 border-t pt-4 text-[10px] leading-relaxed sm:grid-cols-2">
			<div>
				<dt className="font-mono text-foreground">Colors (c)</dt>
				<dd className="text-muted-foreground">
					Palette size, including the background. More colors add more blended
					regions.
				</dd>
			</div>
			<div>
				<dt className="font-mono text-foreground">Vignette (v)</dt>
				<dd className="text-muted-foreground">
					Darkens the outer edge. Higher strength creates a moodier frame.
				</dd>
			</div>
		</dl>
	);
}

function PalettePreview({
	seed,
	activeSeed,
	setSeed,
	className,
}: {
	seed: string;
	activeSeed: string;
	setSeed: (seed: string) => void;
	className?: string;
}) {
	const stops = useMemo(() => paletteFromSeed(activeSeed), [activeSeed]);

	return (
		<div className={`flex items-center gap-2 ${className ?? ""}`}>
			{stops.map((stop) => (
				<div
					key={`${stop.hex}-${stop.oklch.l}-${stop.oklch.c}-${stop.oklch.h}`}
					className="h-8 min-w-0 flex-1 rounded-md"
					style={{ backgroundColor: stop.hex }}
					title={stop.hex}
				/>
			))}
			<Input
				value={seed}
				onChange={(event) => setSeed(event.target.value)}
				placeholder={DEFAULT_SEED}
				aria-label="Preview seed"
				className="h-8 w-28 shrink-0 border-border/60 bg-transparent text-center font-mono text-[11px] text-muted-foreground shadow-none placeholder:text-muted-foreground/60 md:text-[11px] dark:bg-transparent"
			/>
		</div>
	);
}
