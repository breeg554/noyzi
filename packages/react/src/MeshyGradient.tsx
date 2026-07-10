import { generate, seedHash, toSvgDataUri } from "@meshy/core";
import type { CSSProperties, JSX } from "react";
import { cn, frameStyle, type MeshyBaseProps, SHADOW_CLASS } from "./shared.ts";

export interface MeshyGradientProps extends MeshyBaseProps {}

/**
 * Deterministic seed-based gradient as a `<div>` with an SVG background.
 * SSR-safe, zero client JS.
 *
 * Behaves like an `<img>`: `width`/`height` size the element (and the
 * generated artwork). Omit them to size the element with your own CSS — the
 * artwork then defaults to a 1000×1000 square and `cover`-fills the element.
 */
export function MeshyGradient({
	seed,
	options,
	width,
	height,
	rounded,
	className,
	style,
	...rest
}: MeshyGradientProps): JSX.Element {
	const spec = generate(seedHash(seed), options);
	const uri = toSvgDataUri(spec, {
		width: width ?? 1000,
		height: height ?? 1000,
	});

	const mergedStyle: CSSProperties = {
		backgroundImage: `url("${uri}")`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		...frameStyle(width, height, rounded),
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
