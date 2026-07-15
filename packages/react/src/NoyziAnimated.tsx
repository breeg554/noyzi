"use client";

import type { CSSProperties, JSX } from "react";
import { cn, type NoyziBaseProps, SHADOW_CLASS } from "./shared.ts";
import { useAnimatedGradient } from "./use-animated-gradient.ts";

const CANVAS_STYLE: CSSProperties = {
	borderRadius: "inherit",
	height: "100%",
	inset: 0,
	opacity: 0,
	pointerEvents: "none",
	position: "absolute",
	width: "100%",
};

export interface NoyziAnimatedProps extends NoyziBaseProps {
	artwork?: { width?: number; height?: number };
	speed?: number;
	strength?: number;
}

/** Animated WebGL gradient with the deterministic SVG as its first frame and fallback. */
export function NoyziAnimated({
	seed,
	options,
	artwork,
	speed = 1,
	strength = 1.2,
	className,
	style,
	...rest
}: NoyziAnimatedProps): JSX.Element {
	const width = artwork?.width ?? 1000;
	const height = artwork?.height ?? 1000;
	const { canvasRef, fallbackUri } = useAnimatedGradient({
		height,
		options,
		seed,
		speed,
		strength,
		width,
	});

	const mergedStyle: CSSProperties = {
		backgroundImage: `url("${fallbackUri}")`,
		backgroundPosition: "center",
		backgroundSize: "cover",
		...style,
	};

	return (
		<div
			role="img"
			{...rest}
			className={cn("relative", SHADOW_CLASS, className)}
			style={mergedStyle}
		>
			<canvas ref={canvasRef} style={CANVAS_STYLE} />
		</div>
	);
}
