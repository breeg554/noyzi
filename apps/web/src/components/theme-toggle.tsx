import { Moon, Sun } from "lucide-react";

import { Button } from "#/components/ui/button.tsx";

function ThemeToggle() {
	function toggleTheme() {
		const isDark = document.documentElement.classList.toggle("dark");
		localStorage.setItem("theme", isDark ? "dark" : "light");
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
