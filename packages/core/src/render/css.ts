import type { GradientSpec } from "../generate.ts";

export interface CssOutput {
	backgroundColor: string;
	backgroundImage: string;
}

function pct(value: number): string {
	return `${Math.round(value * 10000) / 100}%`;
}

/** Renders a gradient spec to plain CSS properties. Lightest output — no warp or grain. */
export function toCss(spec: GradientSpec): CssOutput {
	const layers = [...spec.blobs]
		.reverse()
		.map(
			(blob) =>
				`radial-gradient(circle at ${pct(blob.x)} ${pct(blob.y)}, ${blob.color.hex} 0%, ${blob.color.hex}cc ${pct(blob.radius * 0.45)}, ${blob.color.hex}00 ${pct(blob.radius)})`,
		);

	return {
		backgroundColor: spec.background.hex,
		backgroundImage: layers.join(", "),
	};
}
