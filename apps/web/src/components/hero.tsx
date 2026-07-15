import { NoyziAnimated, NoyziGradient } from "@noyzi/react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCopyGradientComponent } from "#/components/gradient-card.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	type GalleryOptions,
	resolveGalleryOptions,
	toGenerateOptions,
} from "#/lib/gallery-options.ts";

const INSTALL_COMMAND = "bun add @noyzi/core";
const AVATAR_SEEDS = ["color", "gradient", "seed"];
const AVATAR_ARTWORK = { width: 240, height: 240 };
const route = getRouteApi("/");

export function Hero() {
	const search = route.useSearch();
	const options = resolveGalleryOptions(search);

	return (
		<section className="flex flex-col items-center gap-5 px-4 pt-8 pb-20 text-center sm:pt-10 sm:pb-24">
			<div className="-space-x-3 flex">
				{AVATAR_SEEDS.map((seed) => (
					<HeroAvatar key={seed} seed={seed} options={options} />
				))}
			</div>
			<h1 className="max-w-xl text-balance font-semibold text-4xl tracking-tighter sm:text-5xl">
				Beautiful gradients from any seed
			</h1>
			<p className="max-w-xl text-balance text-muted-foreground text-sm leading-relaxed sm:text-base">
				Turn any email, username or id into a unique gradient. Deterministic,
				SSR-safe, no stored assets.
			</p>
			<Button
				asChild
				variant="outline"
				className="group mt-2 h-auto gap-3 rounded-lg border-border/60 bg-card py-2 pr-2 pl-4 font-mono font-normal shadow-none hover:bg-neutral-100 dark:border-border/60 dark:bg-card dark:hover:bg-[oklch(0.21_0_0)]"
			>
				<Link to="/docs" aria-label="Install noyzi — read the docs">
					<span>
						<span className="select-none text-muted-foreground">$ </span>
						{INSTALL_COMMAND}
					</span>
					<span className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground [&_svg]:size-3">
						<ArrowRight />
					</span>
				</Link>
			</Button>
		</section>
	);
}

function HeroAvatar({
	seed,
	options,
}: {
	seed: string;
	options: GalleryOptions;
}) {
	const { copy } = useCopyGradientComponent(
		seed,
		options,
		"size-10 shrink-0 rounded-full ring-2 ring-background",
		options.animated,
	);
	const className = "size-10 shrink-0 rounded-full ring-2 ring-background";

	return (
		<Button
			variant="ghost"
			onClick={copy}
			aria-label={`Copy component for seed "${seed}"`}
			className="relative size-auto cursor-pointer rounded-full p-0 hover:z-10 hover:scale-110 hover:bg-transparent dark:hover:bg-transparent"
		>
			{options.animated ? (
				<NoyziAnimated
					seed={seed}
					options={toGenerateOptions(options)}
					artwork={AVATAR_ARTWORK}
					title={seed}
					className={className}
					speed={3}
					strength={3}
				/>
			) : (
				<NoyziGradient
					seed={seed}
					options={toGenerateOptions(options)}
					artwork={AVATAR_ARTWORK}
					title={seed}
					className={className}
				/>
			)}
		</Button>
	);
}
