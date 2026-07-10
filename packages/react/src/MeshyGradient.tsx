import { generate, seedHash, toSvgDataUri } from "@meshy/core";
import type { CSSProperties, JSX } from "react";
import { frameStyle, type MeshyBaseProps } from "./shared.ts";

export interface MeshyGradientProps extends MeshyBaseProps {
	width?: number;
	height?: number;
	/** Pixel density multiplier applied to `size` when generating the SVG (default 2 for retina-crisp grain). */
	density?: number;
}

/** Deterministic seed-based gradient as a `<div>` with an SVG background. SSR-safe. With `size`, the SVG is generated at `size * density` so grain maps to device pixels. */
export function MeshyGradient({
	seed,
	options,
	width = 800,
	height = 1000,
	size,
	density = 2,
	rounded,
	style,
	...rest
}: MeshyGradientProps): JSX.Element {
	const spec = generate(seedHash(seed), options);
	const uri = toSvgDataUri(spec, {
		width: size !== undefined ? size * density : width,
		height: size !== undefined ? size * density : height,
	});

	const mergedStyle: CSSProperties = {
		backgroundImage: `url("${uri}")`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		...frameStyle(size, rounded),
		...style,
	};

	return <div role="img" {...rest} style={mergedStyle} />;
}
