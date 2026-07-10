import { motion } from "motion/react";
import type { ReactNode } from "react";

function FadeIn({
	delay = 0,
	className,
	children,
}: {
	delay?: number;
	className?: string;
	children: ReactNode;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, filter: "blur(4px)" }}
			animate={{ opacity: 1, filter: "blur(0px)" }}
			transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export { FadeIn };
