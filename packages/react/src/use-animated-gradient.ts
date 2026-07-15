"use client";

import {
	ANIMATION_RANGES,
	type AnimatedCanvas,
	drawToAnimatedCanvas,
	type GenerateOptions,
	type GradientSpec,
	generate,
	type Seed,
	seedHash,
	toSvgDataUri,
} from "@noyzi/core";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { useNoyziAnimatedGroup } from "./NoyziAnimatedGroup.tsx";
import {
	hideAnimatedCanvas,
	revealAnimatedCanvas,
	type SharedAnimatedController,
} from "./shared-animated.ts";

type AnimatedGroup = NonNullable<ReturnType<typeof useNoyziAnimatedGroup>>;

interface AnimatedGradientHookOptions {
	height: number;
	options: GenerateOptions | undefined;
	seed: Seed;
	speed: number;
	strength: number;
	width: number;
}

interface AnimatedGradientHookResult {
	canvasRef: RefObject<HTMLCanvasElement | null>;
	fallbackUri: string;
}

interface AnimationSetupOptions {
	canvas: HTMLCanvasElement;
	height: number;
	spec: GradientSpec;
	speed: number;
	strength: number;
	width: number;
}

function validateMotionValue(
	name: keyof typeof ANIMATION_RANGES,
	value: number,
): void {
	const range = ANIMATION_RANGES[name];
	if (!Number.isFinite(value) || value < range.min || value > range.max) {
		throw new RangeError(
			`${name} must be a finite number between ${range.min} and ${range.max}`,
		);
	}
}

function setupGroupedAnimation(
	group: AnimatedGroup,
	{ canvas, height, spec, speed, strength, width }: AnimationSetupOptions,
): () => void {
	let cancelled = false;
	let controller: SharedAnimatedController | null = null;
	let active = false;
	let initializing = false;
	let registration = 0;
	const setActive = (nextActive: boolean) => {
		if (nextActive === active) {
			return;
		}
		active = nextActive;
		if (active) {
			void initialize().catch(() => {});
			return;
		}
		registration += 1;
		controller?.destroy();
		controller = null;
	};
	const resizeObserver =
		typeof ResizeObserver === "undefined"
			? null
			: new ResizeObserver(() => controller?.resize());

	const initialize = async () => {
		if (controller || initializing || cancelled || !active) {
			return;
		}
		initializing = true;
		const currentRegistration = ++registration;
		let nextController: SharedAnimatedController | null = null;
		try {
			nextController = await group.actions.register(canvas, spec, {
				height,
				speed,
				strength,
				width,
			});
		} finally {
			initializing = false;
		}
		if (cancelled || currentRegistration !== registration) {
			nextController?.destroy();
			if (active && !cancelled) {
				void initialize().catch(() => {});
			}
			return;
		}
		controller = nextController;
	};
	resizeObserver?.observe(canvas);
	const stopWatching = group.actions.observeVisibility(canvas, setActive);

	return () => {
		cancelled = true;
		active = false;
		registration += 1;
		resizeObserver?.disconnect();
		stopWatching();
		controller?.destroy();
		hideAnimatedCanvas(canvas);
	};
}

function setupStandaloneAnimation({
	canvas,
	height,
	spec,
	speed,
	strength,
	width,
}: AnimationSetupOptions): () => void {
	let cancelled = false;
	let animationFrame = 0;
	let elapsed = 0;
	let lastFrame = performance.now();
	let intersecting = true;
	let renderer: AnimatedCanvas | null = null;
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	const stop = () => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = 0;
		}
	};
	const frame = (now: number) => {
		animationFrame = 0;
		if (!renderer || reducedMotion.matches || !intersecting) {
			return;
		}
		const delta = Math.min((now - lastFrame) / 1000, 0.05);
		lastFrame = now;
		elapsed += delta;
		renderer.render(elapsed);
		animationFrame = requestAnimationFrame(frame);
	};
	const start = () => {
		if (
			cancelled ||
			!renderer ||
			speed <= 0 ||
			reducedMotion.matches ||
			!intersecting ||
			document.hidden ||
			animationFrame
		) {
			return;
		}
		lastFrame = performance.now();
		animationFrame = requestAnimationFrame(frame);
	};
	const handleMotionChange = () => {
		if (reducedMotion.matches) {
			stop();
			elapsed = 0;
			renderer?.render(0);
		} else {
			start();
		}
	};
	const handleVisibilityChange = () => {
		if (document.hidden) {
			stop();
		} else {
			start();
		}
	};
	const handleContextLost = () => {
		stop();
		hideAnimatedCanvas(canvas);
	};
	const resizeObserver =
		typeof ResizeObserver === "undefined"
			? null
			: new ResizeObserver(() => {
					if (renderer?.resize()) {
						renderer.render(reducedMotion.matches ? 0 : elapsed);
					}
				});
	const intersectionObserver =
		typeof IntersectionObserver === "undefined"
			? null
			: new IntersectionObserver(([entry]) => {
					intersecting = entry?.isIntersecting ?? true;
					if (intersecting) {
						start();
					} else {
						stop();
					}
				});
	const initialize = async () => {
		const nextRenderer = await drawToAnimatedCanvas(spec, canvas, {
			height,
			speed,
			strength,
			width,
		});
		if (cancelled) {
			nextRenderer?.destroy();
			return;
		}
		renderer = nextRenderer;
		if (!renderer) {
			return;
		}
		revealAnimatedCanvas(canvas, reducedMotion.matches);
		resizeObserver?.observe(canvas);
		intersectionObserver?.observe(canvas);
		start();
	};

	canvas.addEventListener("webglcontextlost", handleContextLost);
	document.addEventListener("visibilitychange", handleVisibilityChange);
	reducedMotion.addEventListener("change", handleMotionChange);
	void initialize().catch(() => {});

	return () => {
		cancelled = true;
		stop();
		resizeObserver?.disconnect();
		intersectionObserver?.disconnect();
		canvas.removeEventListener("webglcontextlost", handleContextLost);
		document.removeEventListener("visibilitychange", handleVisibilityChange);
		reducedMotion.removeEventListener("change", handleMotionChange);
		renderer?.destroy();
		hideAnimatedCanvas(canvas);
	};
}

export function useAnimatedGradient({
	height,
	options,
	seed,
	speed,
	strength,
	width,
}: AnimatedGradientHookOptions): AnimatedGradientHookResult {
	validateMotionValue("speed", speed);
	validateMotionValue("strength", strength);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const group = useNoyziAnimatedGroup();
	const colors = options?.colors;
	const paletteKey = options?.palette?.join(",") ?? "";
	const vignette =
		options?.vignette === false ? false : options?.vignette?.strength;
	const artwork = useMemo(() => {
		const normalizedOptions: GenerateOptions = {};
		if (colors !== undefined) {
			normalizedOptions.colors = colors;
		}
		if (paletteKey) {
			normalizedOptions.palette = paletteKey.split(",") as NonNullable<
				GenerateOptions["palette"]
			>;
		}
		if (vignette === false) {
			normalizedOptions.vignette = false;
		} else if (typeof vignette === "number") {
			normalizedOptions.vignette = { strength: vignette };
		}
		const spec = generate(seedHash(seed), normalizedOptions);
		return {
			spec,
			uri: toSvgDataUri(spec, { height, width }),
		};
	}, [colors, height, paletteKey, seed, vignette, width]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}
		const setupOptions = {
			canvas,
			height,
			spec: artwork.spec,
			speed,
			strength,
			width,
		};
		return group
			? setupGroupedAnimation(group, setupOptions)
			: setupStandaloneAnimation(setupOptions);
	}, [artwork.spec, group, height, speed, strength, width]);

	return {
		canvasRef,
		fallbackUri: artwork.uri,
	};
}
