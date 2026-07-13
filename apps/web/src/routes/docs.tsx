import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ChevronDown,
	ExternalLink,
	Link as LinkIcon,
	List,
} from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { CodeBlock } from "#/components/code-block.tsx";
import { DocPreview } from "#/components/doc-preview.tsx";
import { FadeIn } from "#/components/fade-in.tsx";
import { InstallBlock } from "#/components/install-block.tsx";
import { OutputLab } from "#/components/output-lab.tsx";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import { playExternalLink } from "#/lib/click-sound.ts";
import {
	DOC_PACKAGES,
	type DocEntry,
	type DocPackage,
	entriesForPackage,
} from "#/lib/docs.ts";
import { createMeta } from "#/lib/meta.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/docs")({
	component: DocsPage,
	head: () =>
		createMeta({
			title: "Docs",
			description:
				"Get started with Noyzi. Installation, usage, and API reference.",
			path: "/docs",
		}),
});

const GET_STARTED_EXAMPLE = `import { NoyziGradient } from "@noyzi/react";

export function Avatar({ email }: { email: string }) {
	return <NoyziGradient seed={email} className="size-10 rounded-full" />;
}`;

const PACKAGE_URLS: Record<DocPackage, string> = {
	"@noyzi/core": "https://www.npmjs.com/package/@noyzi/core",
	"@noyzi/react": "https://www.npmjs.com/package/@noyzi/react",
};

function DocsPage() {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
				className="sticky top-14 z-40 lg:hidden"
			>
				<div
					aria-hidden
					className={cn(
						"pointer-events-none absolute inset-x-0 -top-14 bottom-0 backdrop-blur-lg transition-[mask-image] duration-200",
						mobileNavOpen
							? "[mask-image:linear-gradient(to_bottom,black_92%,transparent)]"
							: "[mask-image:linear-gradient(to_bottom,black_60%,transparent)]",
					)}
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 -top-14 bottom-0 bg-linear-to-b from-background/70 via-background/40 to-transparent"
				/>
				<div className="relative mx-auto w-full max-w-5xl px-4 pb-2 sm:px-6">
					<MobileDocsNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
				</div>
			</motion.div>

			<div className="mx-auto flex w-full max-w-5xl gap-10 px-4 pt-8 pb-20 sm:px-6">
				<FadeIn className="hidden w-52 shrink-0 lg:block">
					<PackagesSidebar />
				</FadeIn>

				<FadeIn delay={0.1} className="min-w-0 flex-1">
					<main>
						<GetStarted />

						{DOC_PACKAGES.map((pkg) => (
							<section key={pkg}>
								<h2 className="mt-16 border-b pb-3 font-mono text-muted-foreground text-xs tracking-wide">
									<PackageLink pkg={pkg} />
								</h2>
								{entriesForPackage(pkg).map((entry) => (
									<MethodSection key={entry.id} entry={entry} />
								))}
							</section>
						))}

						<OutputLabSection />
					</main>
				</FadeIn>
			</div>
		</>
	);
}

function OutputLabSection() {
	return (
		<section
			id="output-lab"
			className="scroll-mt-28 border-b py-16 lg:scroll-mt-20"
		>
			<h2 className="font-semibold text-3xl tracking-tighter">Output lab</h2>
			<p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
				Compare the same gradient across every renderer. CSS and React wrap the
				reference SVG, while canvas and raster outputs draw from it. Raster
				weight varies by seed, dimensions, quality, and browser encoder.
			</p>
			<div className="mt-6">
				<OutputLab />
			</div>
		</section>
	);
}

function GetStarted() {
	return (
		<section id="get-started" className="scroll-mt-28 lg:scroll-mt-20">
			<h1 className="font-semibold text-4xl tracking-tighter">Get started</h1>
			<p className="mt-4 max-w-xl text-muted-foreground text-sm leading-relaxed sm:text-base">
				noyzi turns any seed — email, username, id — into a structured gradient.
				Deterministic: same seed, same gradient, server and browser. No stored
				assets.
			</p>

			<InstallBlock className="mt-6" packages="@noyzi/core @noyzi/react" />

			<h2 className="mt-10 font-semibold text-xl tracking-tight">
				The packages
			</h2>
			<ul className="mt-4 flex max-w-2xl flex-col gap-3 text-muted-foreground text-sm leading-relaxed">
				<li>
					<PackageLink pkg="@noyzi/core" /> — framework-agnostic,
					zero-dependency engine: seed →{" "}
					<code className="font-mono">GradientSpec</code> → CSS / SVG / canvas /
					image. Runs anywhere.
				</li>
				<li>
					<PackageLink pkg="@noyzi/react" /> —{" "}
					<code className="font-mono">&lt;NoyziGradient /&gt;</code> on top:
					SSR-safe, zero client JS.
				</li>
			</ul>

			<h2 className="mt-10 font-semibold text-xl tracking-tight">
				How it works
			</h2>
			<p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
				<code className="font-mono">seedHash</code> hashes the seed → a seeded
				PRNG picks a palette and 1–4 organic color fields (
				<code className="font-mono">generate</code>) → the spec renders through
				any output. It's a plain object: generate once, render anywhere.
			</p>

			<CodeBlock
				className="mt-6"
				label="Example"
				lang="tsx"
				code={GET_STARTED_EXAMPLE}
			/>
		</section>
	);
}

function PackageLink({ pkg }: { pkg: DocPackage }) {
	return (
		<a
			href={PACKAGE_URLS[pkg]}
			target="_blank"
			rel="noreferrer"
			aria-label={`${pkg} on npm`}
			onClick={playExternalLink}
			className="inline-flex items-center gap-1 font-mono text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
		>
			{pkg}
			<ExternalLink className="size-3" />
		</a>
	);
}

function AnchorLink({
	id,
	className,
	children,
	onClick,
}: {
	id: string;
	className?: string;
	children: ReactNode;
	onClick?: () => void;
}) {
	return (
		<Link
			to="/docs"
			hash={id}
			hashScrollIntoView={{ behavior: "smooth", block: "start" }}
			resetScroll={false}
			className={className}
			onClick={onClick}
		>
			{children}
		</Link>
	);
}

function MobileDocsNav({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const close = () => onOpenChange(false);

	return (
		<Collapsible
			open={open}
			onOpenChange={onOpenChange}
			className="group/mobile"
		>
			<CollapsibleTrigger className="flex h-11 w-full cursor-pointer items-center justify-between text-sm">
				<span className="flex items-center gap-2 font-medium">
					<List className="size-4 text-muted-foreground" />
					On this page
				</span>
				<ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]/mobile:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent className="max-h-[calc(100vh-7rem)] overflow-y-auto pb-5">
				<nav aria-label="Docs navigation" className="border-t pt-4">
					<AnchorLink
						id="get-started"
						onClick={close}
						className="block pb-4 font-medium text-sm"
					>
						Get started
					</AnchorLink>

					<div className="grid gap-5 sm:grid-cols-2">
						{DOC_PACKAGES.map((pkg) => (
							<div key={pkg}>
								<p className="pb-2 font-mono text-[11px] text-muted-foreground">
									{pkg}
								</p>
								<ul className="grid grid-cols-2 border-l sm:grid-cols-1">
									{entriesForPackage(pkg).map((entry) => (
										<li key={entry.id}>
											<AnchorLink
												id={entry.id}
												onClick={close}
												className="block py-1 pl-3 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
											>
												{entry.name}
											</AnchorLink>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>

					<AnchorLink
						id="output-lab"
						onClick={close}
						className="mt-5 block border-t pt-4 font-medium text-sm"
					>
						Output lab
					</AnchorLink>
				</nav>
			</CollapsibleContent>
		</Collapsible>
	);
}

function PackagesSidebar() {
	return (
		<nav
			aria-label="API methods by package"
			className="sticky top-20 flex flex-col gap-4 text-sm"
		>
			<AnchorLink
				id="get-started"
				className="pb-2 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
			>
				Get started
			</AnchorLink>
			{DOC_PACKAGES.map((pkg) => (
				<Collapsible key={pkg} defaultOpen className="group">
					<CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 pb-2 font-mono text-muted-foreground text-xs transition-colors hover:text-foreground">
						{pkg}
						<ChevronDown className="group-data-[state=closed]:-rotate-90 size-3.5 transition-transform" />
					</CollapsibleTrigger>
					<CollapsibleContent>
						<ul className="flex flex-col border-l pb-2">
							{entriesForPackage(pkg).map((entry) => (
								<li key={entry.id}>
									<AnchorLink
										id={entry.id}
										className="-ml-px block border-transparent border-l py-1 pl-3 font-mono text-[13px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
									>
										{entry.name}
									</AnchorLink>
								</li>
							))}
						</ul>
					</CollapsibleContent>
				</Collapsible>
			))}
			<AnchorLink
				id="output-lab"
				className="font-mono text-muted-foreground text-xs transition-colors hover:text-foreground"
			>
				Output lab
			</AnchorLink>
		</nav>
	);
}

function MethodSection({ entry }: { entry: DocEntry }) {
	return (
		<section
			id={entry.id}
			className="scroll-mt-28 border-b py-10 last:border-b-0 lg:scroll-mt-20"
		>
			<AnchorLink
				id={entry.id}
				className="group inline-flex items-center gap-2 font-semibold text-2xl tracking-tight"
			>
				<h3 className="font-mono">{entry.name}</h3>
				<LinkIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
			</AnchorLink>

			<CodeBlock
				className="mt-4"
				label="Signature"
				lang="typescript"
				code={entry.signature}
			/>

			<p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
				{entry.description}
			</p>

			{entry.example ? (
				<CodeBlock
					className="mt-4"
					label="Example"
					lang="tsx"
					code={entry.example}
				/>
			) : null}

			{entry.preview ? (
				<DocPreview kind={entry.preview} className="mt-4" />
			) : null}

			{entry.note ? (
				<p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
					<span className="font-medium text-foreground">Note: </span>
					{entry.note}
				</p>
			) : null}
		</section>
	);
}
