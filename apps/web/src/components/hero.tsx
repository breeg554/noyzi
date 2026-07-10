import { MeshyGradient } from "@meshy/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useCopyGradient } from "#/components/gradient-card.tsx";
import { Button } from "#/components/ui/button.tsx";

const INSTALL_COMMAND = "npm install @meshy/react";
const AVATAR_SEEDS = ["mesh", "gradient", "seed"];

export function Hero() {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(INSTALL_COMMAND);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<section className="flex flex-col items-center gap-5 px-4 pt-8 pb-20 text-center sm:pt-10 sm:pb-24">
			<div className="-space-x-3 flex">
				{AVATAR_SEEDS.map((seed) => (
					<HeroAvatar key={seed} seed={seed} />
				))}
			</div>

			<h1 className="max-w-xl text-balance font-semibold text-4xl tracking-tighter sm:text-5xl">
				Beautiful mesh gradients from any seed
			</h1>

			<p className="max-w-md text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
				Deterministic, SSR-safe gradient avatars for React. Same seed, same
				gradient — every time.
			</p>

			<Button
				variant="outline"
				onClick={copy}
				aria-label="Copy install command"
				className="mt-2 h-auto gap-3 rounded-lg border-border/60 bg-card py-2 pr-2 pl-4 font-mono font-normal shadow-none hover:bg-neutral-100 dark:border-border/60 dark:bg-card dark:hover:bg-[oklch(0.21_0_0)]"
			>
				<span>
					<span className="select-none text-muted-foreground">$ </span>
					{INSTALL_COMMAND}
				</span>
				<span className="inline-flex size-6 items-center justify-center rounded-md [&_svg]:size-3">
					{copied ? <Check /> : <Copy />}
				</span>
			</Button>
		</section>
	);
}

function HeroAvatar({ seed }: { seed: string }) {
	const { copy } = useCopyGradient(seed);

	return (
		<Button
			variant="ghost"
			onClick={copy}
			aria-label={`Copy gradient for seed "${seed}"`}
			className="relative size-auto cursor-pointer rounded-full p-0 hover:z-10 hover:scale-110 hover:bg-transparent dark:hover:bg-transparent"
		>
			<MeshyGradient
				seed={seed}
				title={seed}
				className="size-10 shrink-0 rounded-full ring-2 ring-background"
			/>
		</Button>
	);
}
