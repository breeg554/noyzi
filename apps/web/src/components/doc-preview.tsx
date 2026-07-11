import { paletteFromSeed } from "@noyzi/core";
import { useDeferredValue, useMemo, useState } from "react";
import { Input } from "#/components/ui/input.tsx";

const DEFAULT_SEED = "ada";

export function DocPreview({ className }: { className?: string }) {
	const [seed, setSeed] = useState("");
	const activeSeed = useDeferredValue(seed.trim() || DEFAULT_SEED);
	const stops = useMemo(() => paletteFromSeed(activeSeed), [activeSeed]);

	return (
		<div className={`flex items-center gap-2 ${className ?? ""}`}>
			{stops.map((stop, index) => (
				<div
					key={`${stop.hex}-${
						// biome-ignore lint/suspicious/noArrayIndexKey: palette can contain duplicate hex values
						index
					}`}
					className="h-8 min-w-0 flex-1 rounded-md"
					style={{ backgroundColor: stop.hex }}
					title={stop.hex}
				/>
			))}
			<Input
				value={seed}
				onChange={(event) => setSeed(event.target.value)}
				placeholder={DEFAULT_SEED}
				aria-label="Preview seed"
				className="h-8 w-28 shrink-0 border-border/60 bg-transparent text-center font-mono text-[11px] text-muted-foreground shadow-none placeholder:text-muted-foreground/60 md:text-[11px] dark:bg-transparent"
			/>
		</div>
	);
}
