import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "#/components/theme-toggle.tsx";

function Header() {
	return (
		<header className="sticky top-0 z-50">
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

				<ThemeToggle />
			</div>
		</header>
	);
}

export { Header };
