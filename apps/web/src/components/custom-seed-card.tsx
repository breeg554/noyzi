import { MeshyGradient } from "@meshy/react";
import { useRef, useState } from "react";
import {
	CopyButton,
	DownloadButton,
	useCopyGradient,
} from "#/components/gradient-card.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { cn } from "#/lib/utils.ts";

const PREVIEW_SIZE = 224;
const RENDER_SIZE = PREVIEW_SIZE * 2;
const DEFAULT_SEED = "meshy";

export function CustomSeedCard() {
	const [seed, setSeed] = useState("");
	const [keyboardFocus, setKeyboardFocus] = useState(false);
	const pointerRef = useRef(false);
	const activeSeed = seed.trim() || DEFAULT_SEED;
	const { copied, copy } = useCopyGradient(activeSeed);

	return (
		<Card
			onClick={copy}
			className="group relative col-span-2 row-span-2 cursor-pointer justify-center rounded-md border-none p-2 shadow-none transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-[oklch(0.21_0_0)]"
		>
			<span className="absolute top-4 left-4 text-[11px] text-muted-foreground leading-none">
				custom
			</span>
			<span className="absolute top-4 right-4 truncate text-[11px] text-muted-foreground leading-none">
				{activeSeed}
			</span>
			<CardContent className="flex flex-col items-center gap-6 px-2">
				<MeshyGradient
					seed={activeSeed}
					width={RENDER_SIZE}
					height={RENDER_SIZE}
					rounded={12}
					title={activeSeed}
					style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
				/>
				<Input
					value={seed}
					onChange={(event) => setSeed(event.target.value)}
					onClick={(event) => event.stopPropagation()}
					onPointerDown={() => {
						pointerRef.current = true;
					}}
					onFocus={() => {
						setKeyboardFocus(!pointerRef.current);
						pointerRef.current = false;
					}}
					onBlur={() => setKeyboardFocus(false)}
					placeholder="type a seed"
					className={cn(
						"max-w-56 border-none bg-transparent text-center shadow-none dark:bg-transparent",
						!keyboardFocus && "focus-visible:ring-0",
					)}
				/>
				<div className="flex translate-y-2 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
					<CopyButton copied={copied} onCopy={copy} />
					<DownloadButton seed={activeSeed} />
				</div>
			</CardContent>
		</Card>
	);
}
