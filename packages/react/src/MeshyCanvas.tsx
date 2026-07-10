import {
	type GenerateOptions,
	generate,
	type Seed,
	seedHash,
	toCanvas,
} from "@meshy/core";
import {
	type CSSProperties,
	type JSX,
	useEffect,
	useMemo,
	useRef,
} from "react";

export interface MeshyCanvasProps
	extends Omit<JSX.IntrinsicElements["canvas"], "children"> {
	seed: Seed;
	options?: GenerateOptions;
	width?: number;
	height?: number;
}

export function MeshyCanvas({
	seed,
	options,
	width = 800,
	height = 1000,
	style,
	...rest
}: MeshyCanvasProps): JSX.Element {
	if (typeof document === "undefined") {
		throw new Error(
			"MeshyCanvas is a client-only component and cannot be rendered on the server. Use MeshyGradient for SSR.",
		);
	}

	const ref = useRef<HTMLCanvasElement>(null);
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
		toCanvas(spec, { width, height })
			.then((painted) => {
				if (cancelled) {
					return;
				}
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					return;
				}
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(painted, 0, 0, canvas.width, canvas.height);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [spec, width, height]);

	const mergedStyle: CSSProperties = {
		backgroundColor: spec.background.hex,
		...style,
	};

	return (
		<canvas
			ref={ref}
			width={width}
			height={height}
			role="img"
			{...rest}
			style={mergedStyle}
		/>
	);
}
