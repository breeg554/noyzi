import { generate, seedHash, toSvgDataUri } from "@noyzi/core";
import type { CSSProperties, JSX } from "react";
import { cn, type NoyziBaseProps, SHADOW_CLASS } from "./shared.ts";

export interface NoyziGradientProps extends NoyziBaseProps {
	/**
	 * Intrinsic artwork size. The SVG is vector, so only the aspect ratio
	 * affects the visual result — match it to your element for non-square
	 * layouts. Defaults to 1000×1000.
	 */
	artwork?: { width?: number; height?: number };
}

/**
 * Deterministic seed-based gradient as a `<div>` with an SVG background.
 * SSR-safe, zero client JS.
 *
 * Size and shape the element with your own CSS (e.g. `className="size-10
 * rounded-full"`). The artwork `cover`-fills the element; use `artwork` to
 * match its aspect ratio for non-square elements.
 */
export function NoyziGradient({
	seed,
	options,
	artwork,
	className,
	style,
	...rest
}: NoyziGradientProps): JSX.Element {
	const spec = generate(seedHash(seed), options);
	const uri = toSvgDataUri(spec, artwork);

	const mergedStyle: CSSProperties = {
		backgroundImage: `url("${uri}")`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		...style,
	};

	return (
		<div
			role="img"
			{...rest}
			className={cn(SHADOW_CLASS, className)}
			style={mergedStyle}
		/>
	);
}
