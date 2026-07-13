import type { GradientSpec } from "../generate.ts";
import { type SvgOptions, toSvgDataUri } from "./svg.ts";

export interface CssOutput {
	backgroundColor: string;
	backgroundImage: string;
	backgroundPosition: string;
	backgroundRepeat: string;
	backgroundSize: string;
}

/** Renders a gradient spec to plain CSS properties. */
export function toCss(spec: GradientSpec, options: SvgOptions = {}): CssOutput {
	return {
		backgroundColor: spec.background.hex,
		backgroundImage: `url("${toSvgDataUri(spec, options)}")`,
		backgroundPosition: "center",
		backgroundRepeat: "no-repeat",
		backgroundSize: "100% 100%",
	};
}
