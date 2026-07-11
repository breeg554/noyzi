import { NoyziGradient } from "@noyzi/react";
import { useRef, useState } from "react";
import {
	CopyButton,
	DownloadButton,
	useCopyGradient,
} from "#/components/gradient-card.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
	DEFAULT_GALLERY_OPTIONS,
	type GalleryOptions,
	toGenerateOptions,
} from "#/lib/gallery-options.ts";
import { cn } from "#/lib/utils.ts";

const DEFAULT_SEED = "noyzi";

export function CustomSeedCard({
	options = DEFAULT_GALLERY_OPTIONS,
}: {
	options?: GalleryOptions;
}) {
	const [seed, setSeed] = useState("");
	const [keyboardFocus, setKeyboardFocus] = useState(false);
	const pointerRef = useRef(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const activeSeed = seed.trim() || DEFAULT_SEED;
	const generateOptions = toGenerateOptions(options);
	const { copied, copy } = useCopyGradient(activeSeed, generateOptions);

	return (
		<Card
			onClick={() => {
				pointerRef.current = true;
				inputRef.current?.focus();
				pointerRef.current = false;
			}}
			className="group relative col-span-1 sm:col-span-2 md:col-span-2 row-span-1 md:row-span-2 justify-center rounded-md border-none p-2 aspect-square shadow-none transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-[oklch(0.21_0_0)]"
		>
			<span className="absolute top-4 left-4 text-[11px] text-muted-foreground leading-none">
				custom
			</span>
			<span className="absolute top-4 right-4 truncate text-[11px] text-muted-foreground leading-none">
				{activeSeed}
			</span>
			<CardContent className="flex flex-col items-center gap-3 px-2 lg:gap-6">
				<NoyziGradient
					seed={activeSeed}
					options={generateOptions}
					className={cn(
						"size-56 shrink-0",
						{
							none: "rounded-none",
							sm: "rounded-2xl",
							md: "rounded-[2rem]",
							xl: "rounded-[5rem]",
							full: "rounded-full",
						}[options.rounded],
					)}
					title={activeSeed}
				/>
				<Input
					ref={inputRef}
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
					placeholder="type a seed..."
					className={cn(
						"max-w-56 border-none bg-transparent text-center shadow-none dark:bg-transparent",
						!keyboardFocus && "focus-visible:ring-0",
					)}
				/>
				<div className="flex translate-y-2 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
					<CopyButton copied={copied} onCopy={copy} />
					<DownloadButton seed={activeSeed} options={generateOptions} />
				</div>
			</CardContent>
		</Card>
	);
}
