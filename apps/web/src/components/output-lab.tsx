import {
	drawToCanvas,
	generate,
	seedHash,
	toBlob,
	toCss,
	toSvg,
	toSvgDataUri,
} from "@noyzi/core";
import { NoyziGradient } from "@noyzi/react";
import {
	type CSSProperties,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Input } from "#/components/ui/input.tsx";

const DEFAULT_SEED = "output-lab";
const WIDTH = 480;
const HEIGHT = 320;
const encoder = new TextEncoder();

type RasterResult = {
	png: { size: number; url: string };
	webp: { size: number; url: string };
};

function formatBytes(value: number): string {
	return value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KiB`;
}

function PreviewCard({
	name,
	method,
	weight,
	children,
}: {
	name: string;
	method: string;
	weight: string;
	children: React.ReactNode;
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-border/60 bg-card">
			<div className="aspect-3/2 overflow-hidden bg-muted">{children}</div>
			<div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
				<div className="min-w-0">
					<p className="truncate font-medium text-xs">{name}</p>
					<p className="truncate font-mono text-[10px] text-muted-foreground">
						{method}
					</p>
				</div>
				<span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
					{weight}
				</span>
			</div>
		</div>
	);
}

export function OutputLab() {
	const [seed, setSeed] = useState("");
	const activeSeed = useDeferredValue(seed.trim() || DEFAULT_SEED);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [raster, setRaster] = useState<RasterResult | null>(null);
	const outputs = useMemo(() => {
		const spec = generate(seedHash(activeSeed));
		const css = toCss(spec, { width: WIDTH, height: HEIGHT });
		const svg = toSvg(spec, { width: WIDTH, height: HEIGHT });
		const uri = toSvgDataUri(spec, { width: WIDTH, height: HEIGHT });
		const cssText = [
			`background-color:${css.backgroundColor}`,
			`background-image:${css.backgroundImage}`,
			`background-position:${css.backgroundPosition}`,
			`background-repeat:${css.backgroundRepeat}`,
			`background-size:${css.backgroundSize}`,
		].join(";");
		return { spec, css, cssText, svg, uri };
	}, [activeSeed]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		let cancelled = false;
		let current: RasterResult | null = null;
		setRaster(null);

		Promise.all([
			drawToCanvas(outputs.spec, canvas, { width: WIDTH, height: HEIGHT }),
			toBlob(outputs.spec, {
				width: WIDTH,
				height: HEIGHT,
				type: "image/webp",
				quality: 0.9,
			}),
			toBlob(outputs.spec, {
				width: WIDTH,
				height: HEIGHT,
				type: "image/png",
			}),
		]).then(([, webp, png]) => {
			if (cancelled) {
				return;
			}
			current = {
				webp: { size: webp.size, url: URL.createObjectURL(webp) },
				png: { size: png.size, url: URL.createObjectURL(png) },
			};
			setRaster(current);
		});

		return () => {
			cancelled = true;
			if (current) {
				URL.revokeObjectURL(current.webp.url);
				URL.revokeObjectURL(current.png.url);
			}
		};
	}, [outputs]);

	const cssStyle = outputs.css satisfies CSSProperties;
	const canvasMemory = WIDTH * HEIGHT * 4;

	return (
		<div>
			<div className="mb-4 flex items-center justify-between gap-4">
				<p className="text-muted-foreground text-xs">
					Same seed · {WIDTH}×{HEIGHT} · sizes measured in your browser
				</p>
				<Input
					value={seed}
					onChange={(event) => setSeed(event.target.value)}
					placeholder={DEFAULT_SEED}
					aria-label="Output comparison seed"
					className="h-8 w-32 shrink-0 border-border/60 bg-transparent text-center font-mono text-[11px] shadow-none md:text-[11px] dark:bg-transparent"
				/>
			</div>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				<PreviewCard
					name="CSS layers"
					method="toCss()"
					weight={formatBytes(encoder.encode(outputs.cssText).byteLength)}
				>
					<div className="size-full" style={cssStyle} />
				</PreviewCard>

				<PreviewCard
					name="SVG"
					method="toSvg()"
					weight={formatBytes(encoder.encode(outputs.svg).byteLength)}
				>
					<img
						className="size-full object-cover"
						src={outputs.uri}
						alt="SVG renderer output"
					/>
				</PreviewCard>

				<PreviewCard
					name="React"
					method="&lt;NoyziGradient /&gt;"
					weight={`${formatBytes(encoder.encode(outputs.uri).byteLength)} URI`}
				>
					<NoyziGradient
						seed={activeSeed}
						artwork={{ width: WIDTH, height: HEIGHT }}
						className="size-full shadow-none"
					/>
				</PreviewCard>

				<PreviewCard
					name="Canvas"
					method="drawToCanvas()"
					weight={`${formatBytes(canvasMemory)} memory`}
				>
					<canvas
						ref={canvasRef}
						width={WIDTH}
						height={HEIGHT}
						className="size-full"
					/>
				</PreviewCard>

				<PreviewCard
					name="WebP"
					method='toBlob({ type: "image/webp" })'
					weight={raster ? formatBytes(raster.webp.size) : "measuring…"}
				>
					{raster ? (
						<img
							className="size-full object-cover"
							src={raster.webp.url}
							alt="WebP renderer output"
						/>
					) : (
						<div className="size-full animate-pulse" style={cssStyle} />
					)}
				</PreviewCard>

				<PreviewCard
					name="PNG"
					method='toBlob({ type: "image/png" })'
					weight={raster ? formatBytes(raster.png.size) : "measuring…"}
				>
					{raster ? (
						<img
							className="size-full object-cover"
							src={raster.png.url}
							alt="PNG renderer output"
						/>
					) : (
						<div className="size-full animate-pulse" style={cssStyle} />
					)}
				</PreviewCard>
			</div>
		</div>
	);
}
