import type { GenerateOptions, Seed } from "@meshy/core";
import type { CSSProperties, JSX } from "react";

/** Props shared by every meshy React renderer. */
export interface MeshyBaseProps
	extends Omit<JSX.IntrinsicElements["div"], "children"> {
	seed: Seed;
	options?: GenerateOptions;
	/** Renders a fixed square at `size` CSS pixels. */
	size?: number;
	/** Border radius in pixels, or `"full"` for a circle. */
	rounded?: number | "full";
}

export function frameStyle(
	size: number | undefined,
	rounded: number | "full" | undefined,
): CSSProperties {
	return {
		...(size !== undefined && {
			width: size,
			height: size,
			flexShrink: 0,
		}),
		...(rounded !== undefined && {
			borderRadius: rounded === "full" ? "9999px" : rounded,
		}),
	};
}
