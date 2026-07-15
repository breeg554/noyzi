import { getRouteApi } from "@tanstack/react-router";
import { playToggle } from "#/lib/click-sound.ts";
import {
	resolveGalleryOptions,
	toGallerySearch,
} from "#/lib/gallery-options.ts";
import { cn } from "#/lib/utils.ts";

const route = getRouteApi("/");
const FLOW_LETTERS = [
	{ color: "#5f76d2", letter: "f" },
	{ color: "#8f77ca", letter: "l" },
	{ color: "#c471af", letter: "o" },
	{ color: "#e9846d", letter: "w" },
];

export function GalleryAnimationToggle({ className }: { className?: string }) {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const options = resolveGalleryOptions(search);

	const toggle = () => {
		playToggle();
		navigate({
			search: toGallerySearch({ ...options, animated: !options.animated }),
			replace: true,
			resetScroll: false,
		});
	};

	return (
		<button
			type="button"
			role="switch"
			aria-checked={options.animated}
			aria-label={
				options.animated
					? "Disable animated gradients"
					: "Enable animated gradients"
			}
			onClick={toggle}
			className={cn(
				"group relative grid h-7 w-14 cursor-pointer place-items-center rounded-md outline-none before:absolute before:-inset-y-2 focus-visible:ring-[3px] focus-visible:ring-ring/35",
				className,
			)}
		>
			<span aria-hidden className="relative h-4 w-10 font-mono text-[10px]">
				<span
					className={cn(
						"absolute inset-0 flex items-center justify-center leading-4 tracking-[0.16em] text-muted-foreground/65 transition-[opacity,color] duration-300 group-hover:text-foreground/75 motion-reduce:transition-none",
						options.animated ? "opacity-0" : "opacity-100",
					)}
				>
					still
				</span>

				<span
					className={cn(
						"absolute inset-0 flex items-center justify-center gap-[1px] leading-4 transition-[opacity,filter] duration-500 motion-reduce:transition-none",
						options.animated
							? "opacity-100 drop-shadow-[0_0_5px_rgba(196,113,175,0.52)]"
							: "opacity-0",
					)}
				>
					{FLOW_LETTERS.map(({ color, letter }, index) => (
						<span
							key={letter}
							className={cn(
								"font-semibold transition-transform duration-300 group-hover:scale-110",
								options.animated &&
									"motion-mode-letter motion-reduce:animate-none",
							)}
							style={{
								animationDelay: `${index * -0.16}s`,
								color,
							}}
						>
							{letter}
						</span>
					))}
				</span>
			</span>
		</button>
	);
}
