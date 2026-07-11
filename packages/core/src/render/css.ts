import type { GradientSpec } from "../generate.ts";

export interface CssOutput {
	backgroundColor: string;
	backgroundImage: string;
}

function pct(value: number): string {
	return `${Math.round(value * 10000) / 100}%`;
}

/** Renders a gradient spec to plain CSS properties. Includes vignette — no warp. */
export function toCss(spec: GradientSpec): CssOutput {
	const layers = [...spec.blobs]
		.reverse()
		.map(
			(blob) =>
				`radial-gradient(circle at ${pct(blob.x)} ${pct(blob.y)}, ${blob.color.hex} 0%, ${blob.color.hex}cc ${pct(blob.radius * 0.45)}, ${blob.color.hex}00 ${pct(blob.radius)})`,
		);

	if (spec.vignette) {
		layers.unshift(
			`radial-gradient(70% 70% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,${spec.vignette.strength}) 100%)`,
		);
	}

	return {
		backgroundColor: spec.background.hex,
		backgroundImage: layers.join(", "),
	};
}
