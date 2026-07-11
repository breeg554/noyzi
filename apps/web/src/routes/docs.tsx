import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Link as LinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CodeBlock } from "#/components/code-block.tsx";
import { DocPreview } from "#/components/doc-preview.tsx";
import { FadeIn } from "#/components/fade-in.tsx";
import { InstallBlock } from "#/components/install-block.tsx";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import { DOC_PACKAGES, type DocEntry, entriesForPackage } from "#/lib/docs.ts";
import { createMeta } from "#/lib/meta.ts";

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

function DocsPage() {
	return (
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
								{pkg}
							</h2>
							{entriesForPackage(pkg).map((entry) => (
								<MethodSection key={entry.id} entry={entry} />
							))}
						</section>
					))}
				</main>
			</FadeIn>
		</div>
	);
}

function GetStarted() {
	return (
		<section id="get-started" className="scroll-mt-20">
			<h1 className="font-semibold text-4xl tracking-tighter">Get started</h1>
			<p className="mt-4 max-w-xl text-muted-foreground text-sm leading-relaxed sm:text-base">
				noyzi turns any seed — email, username, id — into a mesh gradient.
				Deterministic: same seed, same gradient, server and browser. No stored
				assets.
			</p>

			<InstallBlock className="mt-6" packages="@noyzi/core @noyzi/react" />

			<h2 className="mt-10 font-semibold text-xl tracking-tight">
				The packages
			</h2>
			<ul className="mt-4 flex max-w-2xl flex-col gap-3 text-muted-foreground text-sm leading-relaxed">
				<li>
					<code className="font-mono text-foreground">@noyzi/core</code> —
					framework-agnostic, zero-dependency engine: seed →{" "}
					<code className="font-mono">GradientSpec</code> → CSS / SVG / canvas /
					image. Runs anywhere.
				</li>
				<li>
					<code className="font-mono text-foreground">@noyzi/react</code> —{" "}
					<code className="font-mono">&lt;NoyziGradient /&gt;</code> on top:
					SSR-safe, zero client JS.
				</li>
			</ul>

			<h2 className="mt-10 font-semibold text-xl tracking-tight">
				How it works
			</h2>
			<p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
				<code className="font-mono">seedHash</code> hashes the seed → a seeded
				PRNG picks palette, layout and 1–7 blobs (
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

function AnchorLink({
	id,
	className,
	children,
}: {
	id: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<Link
			to="/docs"
			hash={id}
			hashScrollIntoView={{ behavior: "smooth", block: "start" }}
			resetScroll={false}
			className={className}
		>
			{children}
		</Link>
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
		</nav>
	);
}

function MethodSection({ entry }: { entry: DocEntry }) {
	return (
		<section
			id={entry.id}
			className="scroll-mt-20 border-b py-10 last:border-b-0"
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

			{entry.preview ? <DocPreview className="mt-4" /> : null}

			{entry.note ? (
				<p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
					<span className="font-medium text-foreground">Note: </span>
					{entry.note}
				</p>
			) : null}
		</section>
	);
}
