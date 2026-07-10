import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";

import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { playNavDocs, playNavHome } from "#/lib/click-sound.ts";

function Header() {
	return (
		<motion.header
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
			className="sticky top-0 z-50"
		>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 backdrop-blur-lg [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/70 via-background/30 to-transparent"
			/>
			<div className="relative flex h-14 items-center justify-between px-4">
				<Link to="/" className="font-semibold text-lg tracking-tight">
					meshy
				</Link>

				<nav
					aria-label="Main"
					className="-translate-x-1/2 absolute left-1/2 flex items-center gap-5 text-sm"
				>
					<Link
						to="/"
						onClick={playNavHome}
						className="text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
					>
						Home
					</Link>
					<Link
						to="/docs"
						onClick={playNavDocs}
						className="text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
					>
						Docs
					</Link>
				</nav>

				<ThemeToggle />
			</div>
		</motion.header>
	);
}

export { Header };
