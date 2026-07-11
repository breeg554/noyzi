import { NoyziGradient } from "@noyzi/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { FadeIn } from "#/components/fade-in.tsx";
import { useCopyGradientImage } from "#/components/gradient-card.tsx";
import { Button } from "#/components/ui/button.tsx";
import { createMeta } from "#/lib/meta.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/examples")({
	component: ExamplesPage,
	head: () =>
		createMeta({
			title: "Examples — Noyzi",
			description:
				"See Noyzi mesh gradients used as avatars, artwork, app icons, covers, and more.",
			path: "/examples",
		}),
});

const SHAPES = [
	{ seed: "circle", className: "rounded-full" },
	{ seed: "soft-square", className: "rounded-[28%]" },
	{ seed: "arch", className: "rounded-t-full rounded-b-md" },
	{ seed: "pill", className: "w-28 rounded-full" },
	{ seed: "diamond", className: "rotate-45 rounded-xl" },
	{
		seed: "hexagon",
		style: {
			clipPath: "polygon(25% 7%,75% 7%,100% 50%,75% 93%,25% 93%,0 50%)",
		},
	},
	{
		seed: "spark",
		style: {
			clipPath:
				"polygon(50% 0,61% 36%,100% 50%,61% 64%,50% 100%,39% 64%,0 50%,39% 36%)",
		},
	},
	{
		seed: "pebble",
		className: "rounded-[58%_42%_63%_37%/44%_55%_45%_56%]",
	},
] satisfies Array<{
	seed: string;
	className?: string;
	style?: CSSProperties;
}>;

const TEAM = [
	["Maya Chen", "maya@northstar.studio"],
	["Theo Martin", "theo@northstar.studio"],
	["Iris Okafor", "iris@northstar.studio"],
	["Noah Berg", "noah@northstar.studio"],
] as const;

function ExamplesPage() {
	return (
		<main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
			<FadeIn>
				<section className="mx-auto max-w-2xl text-center">
					<p className="font-mono text-muted-foreground text-xs tracking-wide">
						SHAPE STUDIES
					</p>
					<h1 className="mt-4 text-balance font-semibold text-4xl tracking-tighter sm:text-6xl">
						One seed. Any shape.
					</h1>
					<p className="mx-auto mt-5 max-w-lg text-balance text-muted-foreground text-sm leading-relaxed sm:text-base">
						Noyzi artwork has no fixed container. Crop it, stretch it, or mask
						it— the identity stays recognizably yours.
					</p>
				</section>
			</FadeIn>

			<FadeIn delay={0.1}>
				<section
					aria-label="Gradient shape examples"
					className="mt-12 sm:mt-16"
				>
					<div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/70 bg-card sm:grid-cols-4">
						{SHAPES.map((shape, index) => (
							<div
								key={shape.seed}
								className={cn(
									"flex min-h-48 flex-col items-center justify-between border-border/70 p-5",
									index % 2 === 0 && "border-r",
									index < 6 && "border-b",
									index % 4 !== 3 && "sm:border-r",
									index >= 4 && "sm:border-b-0",
								)}
							>
								<span className="self-start font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
									{shape.seed}
								</span>
								<CopyableGradient
									seed={shape.seed}
									className={cn("size-20", shape.className)}
									style={shape.style}
								/>
								<span className="font-mono text-[10px] text-muted-foreground">
									{String(index + 1).padStart(2, "0")}
								</span>
							</div>
						))}
					</div>
					<p className="mt-3 text-center text-[11px] text-muted-foreground">
						Select any shape to copy its artwork
					</p>
				</section>
			</FadeIn>

			<div className="mt-24 space-y-24 sm:mt-32 sm:space-y-32">
				<FadeIn delay={0.15}>
					<ExampleSection
						label="People"
						title="A face for every account"
						description="Use a stable email or user ID. People keep the same visual identity across every surface, without uploading an image."
					>
						<TeamDirectory />
					</ExampleSection>
				</FadeIn>

				<FadeIn delay={0.2}>
					<ExampleSection
						label="Media"
						title="Artwork with a pulse"
						description="Match the canvas to any aspect ratio. A playlist cover, episode tile, and player backdrop can all share one seed."
						reverse
					>
						<MediaPlayer />
					</ExampleSection>
				</FadeIn>

				<FadeIn delay={0.25}>
					<ExampleSection
						label="Brands"
						title="From app icon to billboard"
						description="The output is vector and resolution-independent. Keep the same seed, then let the container do the art direction."
					>
						<BrandSystem />
					</ExampleSection>
				</FadeIn>

				<FadeIn delay={0.3}>
					<section>
						<div className="mx-auto max-w-xl text-center">
							<p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
								Web
							</p>
							<h2 className="mt-3 text-balance font-semibold text-3xl tracking-tighter sm:text-4xl">
								Let the gradient become the page
							</h2>
							<p className="mx-auto mt-4 max-w-md text-muted-foreground text-sm leading-relaxed">
								Stretch one deterministic artwork across the entire viewport,
								then layer your interface directly over it.
							</p>
						</div>
						<FullPageExample />
					</section>
				</FadeIn>
			</div>

			<FadeIn delay={0.35}>
				<section className="mt-24 flex flex-col items-center border-t pt-20 text-center sm:mt-32">
					<div className="flex items-end gap-2" aria-hidden>
						<NoyziGradient seed="build" className="size-8 rounded-full" />
						<NoyziGradient seed="something" className="size-11 rounded-xl" />
						<NoyziGradient
							seed="yours"
							className="h-14 w-20 rounded-full"
							artwork={{ width: 160, height: 112 }}
						/>
					</div>
					<h2 className="mt-6 font-semibold text-3xl tracking-tighter sm:text-4xl">
						Make it yours
					</h2>
					<p className="mt-3 max-w-md text-muted-foreground text-sm leading-relaxed">
						One React component, shaped with the CSS you already know.
					</p>
					<Button asChild variant="outline" className="group mt-6">
						<Link to="/docs">
							Read the docs
							<ArrowRight className="transition-transform group-hover:translate-x-0.5" />
						</Link>
					</Button>
				</section>
			</FadeIn>
		</main>
	);
}

function CopyableGradient({
	seed,
	className,
	style,
}: {
	seed: string;
	className?: string;
	style?: CSSProperties;
}) {
	const { copy } = useCopyGradientImage(seed);

	return (
		<button
			type="button"
			onClick={copy}
			aria-label={`Copy gradient for ${seed}`}
			className="cursor-copy transition-transform duration-300 ease-out hover:scale-110 focus-visible:scale-110"
		>
			<NoyziGradient
				seed={seed}
				title={seed}
				className={cn("shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)]", className)}
				style={style}
			/>
		</button>
	);
}

function ExampleSection({
	label,
	title,
	description,
	reverse = false,
	children,
}: {
	label: string;
	title: string;
	description: string;
	reverse?: boolean;
	children: ReactNode;
}) {
	return (
		<section
			className={cn(
				"grid items-center gap-10 lg:gap-20",
				reverse
					? "lg:grid-cols-[1.08fr_0.92fr]"
					: "lg:grid-cols-[0.72fr_1.28fr]",
			)}
		>
			<div className={cn(reverse && "lg:order-2")}>
				<p className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
					{label}
				</p>
				<h2 className="mt-3 max-w-sm text-balance font-semibold text-3xl tracking-tighter sm:text-4xl">
					{title}
				</h2>
				<p className="mt-4 max-w-sm text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
			</div>
			<div className={cn(reverse && "lg:order-1")}>{children}</div>
		</section>
	);
}

function TeamDirectory() {
	return (
		<div className="overflow-hidden rounded-xl border border-border/70 bg-card">
			<div className="flex items-center justify-between border-b px-5 py-4">
				<span className="font-medium text-sm">Northstar</span>
				<span className="font-mono text-[10px] text-muted-foreground">
					4 MEMBERS
				</span>
			</div>
			<ul className="divide-y">
				{TEAM.map(([name, email], index) => (
					<li key={email} className="flex items-center gap-4 px-5 py-4">
						<NoyziGradient
							seed={email}
							className="size-11 shrink-0 rounded-full"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-sm">{name}</p>
							<p className="truncate text-muted-foreground text-xs">{email}</p>
						</div>
						<span className="hidden rounded-full border px-2 py-1 font-mono text-[9px] text-muted-foreground sm:block">
							{index === 0 ? "OWNER" : "MEMBER"}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function MediaPlayer() {
	return (
		<div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-4 sm:p-6">
			<NoyziGradient
				seed="slow-bloom-radio"
				artwork={{ width: 900, height: 560 }}
				className="absolute inset-0 opacity-25 shadow-none blur-3xl dark:opacity-35"
			/>
			<div className="relative grid gap-5 sm:grid-cols-[11rem_1fr] sm:items-end">
				<NoyziGradient
					seed="slow-bloom-radio"
					className="aspect-square w-full rounded-lg sm:w-44"
				/>
				<div className="min-w-0 pb-1">
					<p className="font-mono text-[10px] text-foreground/60 uppercase tracking-wide">
						Live mix · 42 min
					</p>
					<h3 className="mt-2 font-semibold text-2xl tracking-tight">
						Slow Bloom Radio
					</h3>
					<p className="mt-1 text-foreground/60 text-xs">
						Selected by Mira Sol
					</p>
					<div className="mt-6 flex items-center gap-3">
						<Button
							size="icon"
							className="rounded-full"
							aria-label="Play Slow Bloom Radio"
						>
							<Play className="fill-current" />
						</Button>
						<div className="h-px flex-1 bg-foreground/25">
							<div className="h-px w-2/5 bg-foreground" />
						</div>
						<span className="font-mono text-[10px]">16:48</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function BrandSystem() {
	return (
		<div className="grid grid-cols-[0.82fr_1.18fr] gap-3 sm:gap-4">
			<div className="flex aspect-square items-center justify-center rounded-xl border border-border/70 bg-card">
				<NoyziGradient
					seed={125}
					className="size-24 rounded-[26%] sm:size-32"
				/>
			</div>
			<div className="relative row-span-2 min-h-80 overflow-hidden rounded-xl border border-border/70">
				<NoyziGradient
					seed={33}
					artwork={{ width: 500, height: 760 }}
					className="absolute inset-0 shadow-none"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/10" />
				<div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white sm:p-5">
					<span className="font-semibold tracking-tight">serein</span>
					<span className="font-mono text-[9px]">ISSUE 01</span>
				</div>
				<p className="absolute right-4 bottom-4 left-4 text-balance font-semibold text-2xl text-white leading-none tracking-tighter sm:right-5 sm:bottom-5 sm:left-5 sm:text-3xl">
					Weather for the senses
				</p>
			</div>
			<div className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-4 sm:p-5">
				<NoyziGradient
					seed={99}
					className="absolute -right-8 -bottom-8 size-28 rounded-full opacity-90 shadow-none"
				/>
				<span className="relative font-mono text-[9px] text-muted-foreground">
					MEMBERSHIP
				</span>
				<div className="relative">
					<p className="font-medium text-sm">Elena Moss</p>
					<p className="font-mono text-[9px] text-muted-foreground">
						NO. 00428
					</p>
				</div>
			</div>
		</div>
	);
}

function FullPageExample() {
	return (
		<div className="relative mt-10 aspect-[4/5] overflow-hidden rounded-xl border border-border/70 sm:aspect-[16/9]">
			<NoyziGradient
				seed={55}
				artwork={{ width: 1600, height: 900 }}
				className="absolute inset-0 shadow-none"
			/>
			<div className="absolute inset-0 bg-black/15" />
			<div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/25" />

			<div className="relative flex h-full flex-col justify-between p-5 text-white sm:p-8 lg:p-10">
				<div className="flex items-center justify-between border-white/35 border-b pb-4">
					<span className="font-semibold text-sm tracking-tight sm:text-base">
						Elsewhere
					</span>
					<nav
						aria-label="Full page example navigation"
						className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-wider sm:gap-7 sm:text-[10px]"
					>
						<span>Journal</span>
						<span>Places</span>
						<span>About</span>
					</nav>
				</div>

				<div className="max-w-3xl">
					<p className="font-mono text-[9px] uppercase tracking-[0.18em] sm:text-[10px]">
						Field note 08 · North Atlantic
					</p>
					<h3 className="mt-3 text-balance font-semibold text-4xl leading-[0.88] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
						A slower kind of distance
					</h3>
					<div className="mt-5 flex items-end justify-between gap-6 sm:mt-8">
						<p className="max-w-sm text-white/80 text-xs leading-relaxed sm:text-sm">
							Notes from the coast, where weather rearranges the horizon every
							few minutes.
						</p>
						<span className="shrink-0 rounded-full border border-white/50 px-4 py-2 font-mono text-[9px] uppercase tracking-wider backdrop-blur-sm sm:px-5 sm:py-2.5 sm:text-[10px]">
							Read story
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
