import { generate, seedHash, toBlob, toCss, toDataUrl } from "@meshy/core";
import { MeshyGradient } from "@meshy/react";
import { Check, Copy, Download } from "lucide-react";
import { motion } from "motion/react";
import { type CSSProperties, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PAGE_SIZE } from "#/lib/gradients.ts";

const AVATAR_SIZE = 112;
const GRADIENT_SIZE = AVATAR_SIZE * 2;
const EXPORT_SIZE = 1000;

function gradientBlob(seed: string): Promise<Blob> {
	const spec = generate(seedHash(seed));
	return toBlob(spec, { width: EXPORT_SIZE, height: EXPORT_SIZE });
}

export function useCopyGradient(seed: string) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		const spec = generate(seedHash(seed));
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
			new ClipboardItem({ "image/png": gradientBlob(seed) }),
		]);
	};

	return { copied, copy };
}

export function GradientCard({ seed, index }: { seed: string; index: number }) {
	const animated = index >= PAGE_SIZE;
	const { copied, copy } = useCopyGradient(seed);
	return (
		<motion.div
			initial={animated ? { opacity: 0, y: 8, filter: "blur(4px)" } : false}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{
				duration: 0.3,
				ease: [0.16, 1, 0.3, 1],
				delay: (index % PAGE_SIZE) * 0.012,
			}}
		>
			<Card
				onClick={copy}
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
						<MeshyGradient
							seed={seed}
							width={GRADIENT_SIZE}
							height={GRADIENT_SIZE}
							rounded={6}
							title={seed}
							className="transition-transform duration-200 ease-out group-hover:scale-110"
							style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
						/>
						<div className="-translate-x-1/2 absolute top-[110%] left-1/2 mt-4 flex translate-y-2 items-center gap-1 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
							<CopyButton copied={copied} onCopy={copy} />
							<DownloadButton seed={seed} />
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

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

export function DownloadButton({ seed }: { seed: string }) {
	const download = async () => {
		const spec = generate(seedHash(seed));
		const url = await toDataUrl(spec, {
			width: EXPORT_SIZE,
			height: EXPORT_SIZE,
		});
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `meshy-${seed}.png`;
		anchor.click();
	};

	return (
		<Button
			variant="ghost"
			size="icon-xs"
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
