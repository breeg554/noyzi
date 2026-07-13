import { type GenerateOptions, paletteFromSeed } from "@noyzi/core";
import { NoyziGradient } from "@noyzi/react";
import { useDeferredValue, useMemo, useState } from "react";
import { showGradientCopyToast } from "#/components/gradient-card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { playClick } from "#/lib/click-sound.ts";
import type { DocPreviewKind } from "#/lib/docs.ts";

const DEFAULT_SEED = "ada";

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
