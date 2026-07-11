import {
	type GenerateOptions,
	generate,
	seedHash,
	toBlob,
	toCss,
} from "@noyzi/core";
import { NoyziGradient } from "@noyzi/react";
import { Check, Copy, Download } from "lucide-react";
import { motion } from "motion/react";
import { type CSSProperties, memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { playClick } from "#/lib/click-sound.ts";
import {
	DEFAULT_GALLERY_OPTIONS,
	type GalleryOptions,
	ROUNDED_CLASS,
	toGenerateOptions,
} from "#/lib/gallery-options.ts";
import { cn } from "#/lib/utils.ts";

const EXPORT_SIZE = 2048;
const EXPORT_QUALITY = 0.85;

function gradientBlob(
	seed: string,
	options?: GenerateOptions,
	type: "image/webp" | "image/png" = "image/webp",
): Promise<Blob> {
	const spec = generate(seedHash(seed), options);
	return toBlob(spec, {
		width: EXPORT_SIZE,
		height: EXPORT_SIZE,
		type,
		quality: EXPORT_QUALITY,
	});
}

export function useCopyGradient(seed: string, options?: GenerateOptions) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		const spec = generate(seedHash(seed), options);
		const { backgroundColor, backgroundImage } = toCss(spec);
		toast(
			<>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-full"
					style={{ backgroundColor, backgroundImage }}
				/>
				<span className="relative rounded-full text-white backdrop-blur-[2px]">
					Copied to clipboard
				</span>
			</>,
			{ style: { "--toast-border": spec.background.hex } as CSSProperties },
		);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
		await navigator.clipboard.write([
			new ClipboardItem({
				"image/png": gradientBlob(seed, options, "image/png"),
			}),
		]);
	};

	return { copied, copy };
}

export const GradientCard = memo(function GradientCard({
	seed,
	index,
	options = DEFAULT_GALLERY_OPTIONS,
}: {
	seed: string;
	index: number;
	options?: GalleryOptions;
}) {
	const generateOptions = toGenerateOptions(options);
	const { copied, copy } = useCopyGradient(seed, generateOptions);
	return (
		<motion.div
			initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{
				duration: 0.5,
				ease: [0.16, 1, 0.3, 1],
				delay: (index % 6) * 0.03,
			}}
		>
			<Card
				onClick={() => {
					playClick();
					copy();
				}}
				className="group relative aspect-square cursor-pointer justify-center rounded-md border-none p-2 shadow-none transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-[oklch(0.21_0_0)]"
			>
				<span className="absolute top-4 left-4 text-[11px] text-muted-foreground leading-none">
					{String(index + 1).padStart(4, "0")}
				</span>
				<span className="absolute top-4 right-4 truncate text-[11px] text-muted-foreground leading-none transition-colors duration-200 group-hover:text-foreground">
					{seed}
				</span>
				<CardContent className="flex justify-center px-2">
					<div className="relative">
						<NoyziGradient
							seed={seed}
							options={generateOptions}
							artwork={{ width: 500, height: 500 }}
							title={seed}
							className={cn(
								"size-28 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110",
								ROUNDED_CLASS[options.rounded],
							)}
						/>
						<div className="-translate-x-1/2 absolute top-[110%] left-1/2 mt-4 flex translate-y-2 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
							<CopyButton copied={copied} onCopy={copy} />
							<DownloadButton seed={seed} options={generateOptions} />
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
});

export function CopyButton({
	copied,
	onCopy,
}: {
	copied: boolean;
	onCopy: () => void;
}) {
	return (
		<Button
			variant="ghost"
			size="icon-xs"
			aria-label="Copy image"
			onClick={(event) => {
				event.stopPropagation();
				onCopy();
			}}
			className="hover:bg-foreground/5"
		>
			{copied ? <Check /> : <Copy />}
		</Button>
	);
}

export function DownloadButton({
	seed,
	options,
}: {
	seed: string;
	options?: GenerateOptions;
}) {
	const download = async () => {
		const blob = await gradientBlob(seed, options);
		const extension = blob.type === "image/webp" ? "webp" : "png";
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `noyzi-${seed}.${extension}`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	return (
		<Button
			variant="ghost"
			size="icon-xs"
			sound="deep"
			aria-label="Download image"
			className="hover:bg-foreground/5"
			onClick={(event) => {
				event.stopPropagation();
				download();
			}}
		>
			<Download />
		</Button>
	);
}
