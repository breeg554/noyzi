import {
	type GenerateOptions,
	generate,
	seedHash,
	toCanvas,
} from "@meshy/core";
import {
	type CSSProperties,
	type JSX,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cn, frameStyle, type MeshyBaseProps, SHADOW_CLASS } from "./shared.ts";

export interface MeshyCanvasProps extends MeshyBaseProps {
	fallback?: string;
	fadeDuration?: number;
}

/** Deterministic seed-based gradient painted onto a `<canvas>`. SSR renders a solid placeholder that the gradient fades over on the client. */
export function MeshyCanvas({
	seed,
	options,
	fallback,
	fadeDuration = 400,
	width,
	height,
	rounded,
	className,
	style,
	...rest
}: MeshyCanvasProps): JSX.Element {
	const ref = useRef<HTMLCanvasElement>(null);
	const [ready, setReady] = useState(false);
	const optionsKey = options === undefined ? "" : JSON.stringify(options);

	const opts = useMemo<GenerateOptions | undefined>(
		() => (optionsKey === "" ? undefined : JSON.parse(optionsKey)),
		[optionsKey],
	);

	const spec = useMemo(() => generate(seedHash(seed), opts), [seed, opts]);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) {
			return;
		}
		let cancelled = false;

		const paint = () => {
			const rect = canvas.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			const pxWidth = Math.max(1, Math.round(rect.width * dpr));
			const pxHeight = Math.max(1, Math.round(rect.height * dpr));
			toCanvas(spec, { width: pxWidth, height: pxHeight })
				.then((painted) => {
					if (cancelled) {
						return;
					}
					canvas.width = pxWidth;
					canvas.height = pxHeight;
					canvas.getContext("2d")?.drawImage(painted, 0, 0);
					setReady(true);
				})
				.catch(() => {});
		};

		paint();

		let observer: ResizeObserver | undefined;
		if (typeof ResizeObserver !== "undefined") {
			let initial = true;
			observer = new ResizeObserver(() => {
				if (initial) {
					initial = false;
					return;
				}
				paint();
			});
			observer.observe(canvas);
		}

		return () => {
			cancelled = true;
			observer?.disconnect();
		};
	}, [spec]);

	const wrapperStyle: CSSProperties = {
		position: "relative",
		overflow: "hidden",
		backgroundColor: fallback ?? spec.background.hex,
		...frameStyle(width, height, rounded),
		...style,
	};

	const canvasStyle: CSSProperties = {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		opacity: ready ? 1 : 0,
		filter: ready ? "none" : "blur(12px)",
		transition: `opacity ${fadeDuration}ms ease, filter ${fadeDuration}ms ease`,
	};

	return (
		<div
			role="img"
			{...rest}
			className={cn(SHADOW_CLASS, className)}
			style={wrapperStyle}
		>
			<canvas ref={ref} style={canvasStyle} />
		</div>
	);
}
