import {
	type GenerateOptions,
	generate,
	type Seed,
	seedHash,
	toSvgDataUri,
} from "@meshy/core";
import type { CSSProperties, JSX } from "react";

export interface MeshyGradientProps
	extends Omit<JSX.IntrinsicElements["div"], "children"> {
	seed: Seed;
	options?: GenerateOptions;
	width?: number;
	height?: number;
}

export function MeshyGradient({
	seed,
	options,
	width = 800,
	height = 1000,
	style,
	...rest
}: MeshyGradientProps): JSX.Element {
	const spec = generate(seedHash(seed), options);
	const uri = toSvgDataUri(spec, { width, height });

	const mergedStyle: CSSProperties = {
		backgroundImage: `url("${uri}")`,
		backgroundSize: "cover",
		backgroundPosition: "center",
		...style,
	};

	return <div role="img" {...rest} style={mergedStyle} />;
}
