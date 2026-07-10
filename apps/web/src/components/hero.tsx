import { MeshyGradient } from "@meshy/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
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
		<section className="flex flex-col items-center gap-5 px-4 py-20 text-center sm:py-24">
			<div className="-space-x-3 flex">
				{AVATAR_SEEDS.map((seed) => (
					<MeshyGradient
						key={seed}
						seed={seed}
						width={80}
						height={80}
						title={seed}
						className="rounded-full ring-2 ring-background"
						style={{ width: 40, height: 40 }}
					/>
				))}
			</div>

			<h1 className="max-w-xl text-balance font-semibold text-4xl tracking-tighter sm:text-5xl">
				Beautiful mesh gradients from any seed
			</h1>

			<p className="max-w-md text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
				Deterministic, SSR-safe gradient avatars for React. Same seed, same
				gradient — every time.
			</p>

			<button
				type="button"
				onClick={copy}
				className="mt-2 flex items-center gap-3 rounded-lg border border-border/60 bg-card py-2 pr-2 pl-4 font-mono text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-[oklch(0.21_0_0)]"
			>
				<span>
					<span className="select-none text-muted-foreground">$ </span>
					{INSTALL_COMMAND}
				</span>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Copy install command"
					className="hover:bg-foreground/5"
					asChild
				>
					<span>{copied ? <Check /> : <Copy />}</span>
				</Button>
			</button>
		</section>
	);
}
