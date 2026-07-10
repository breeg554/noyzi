import { MeshyGradient } from "@meshy/react";
import { motion } from "motion/react";
import { Card, CardContent } from "#/components/ui/card.tsx";
import { PAGE_SIZE } from "#/lib/gradients.ts";

const AVATAR_SIZE = 112;
const GRADIENT_SIZE = AVATAR_SIZE * 2;

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
			<Card className="group relative aspect-square justify-center rounded-md border-none p-2 shadow-none transition-colors duration-200 hover:bg-neutral-200/60 dark:hover:bg-muted">
				<span className="absolute top-4 left-4 text-[11px] text-muted-foreground leading-none">
					{String(index + 1).padStart(4, "0")}
				</span>
				<span className="absolute top-4 right-4 truncate text-[11px] text-muted-foreground leading-none transition-colors duration-200 group-hover:text-foreground">
					{seed}
				</span>
				<CardContent className="flex justify-center px-2">
					<MeshyGradient
						seed={seed}
						width={GRADIENT_SIZE}
						height={GRADIENT_SIZE}
						rounded={6}
						title={seed}
						className="transition-transform duration-200 ease-out group-hover:scale-110"
						style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
					/>
				</CardContent>
			</Card>
		</motion.div>
	);
}
