import { Moon, Sun } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";

function ThemeToggle() {
	function toggleTheme() {
		const root = document.documentElement;
		root.classList.add("disable-transitions");
		const isDark = root.classList.toggle("dark");
		localStorage.setItem("theme", isDark ? "dark" : "light");
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				root.classList.remove("disable-transitions");
			});
		});
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label="Toggle theme"
			onClick={toggleTheme}
		>
			<Sun className="dark:hidden" />
			<Moon className="hidden dark:block" />
		</Button>
	);
}

export { ThemeToggle };
