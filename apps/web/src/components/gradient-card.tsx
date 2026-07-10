import { MeshyGradient } from "@meshy/react";
import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardContent, CardFooter } from "#/components/ui/card.tsx";
import { PAGE_SIZE } from "#/lib/gradients.ts";

const AVATAR_SIZE = 112;

export function GradientCard({ seed, index }: { seed: string; index: number }) {
	const animated = index >= PAGE_SIZE;
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
			<Card className="group aspect-square justify-center gap-2 rounded-md border-border/60 p-2 shadow-none transition-colors duration-200 hover:border-border hover:bg-muted">
				<CardContent className="flex justify-center px-2">
					<MeshyGradient
						seed={seed}
						width={AVATAR_SIZE}
						height={AVATAR_SIZE}
						rounded="full"
						title={seed}
						className="transition-transform duration-200 ease-out group-hover:scale-110"
					/>
				</CardContent>
				<CardFooter className="grid grid-cols-[1fr_auto_1fr] items-center px-2">
					<span />
					<span className="truncate text-center text-[10px] leading-none text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
						{seed}
					</span>
					<CopySeedButton seed={seed} />
				</CardFooter>
			</Card>
		</motion.div>
	);
}

function CopySeedButton({ seed }: { seed: string }) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(seed);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<Button
			variant="ghost"
			size="icon-xs"
			aria-label="Copy seed"
			className="justify-self-end opacity-0 transition-opacity group-hover:opacity-100"
			onClick={copy}
		>
			{copied ? <Check /> : <Copy />}
		</Button>
	);
}
