import type { ReactNode } from "react";
import { cn } from "#/lib/utils.ts";
import { NoyziAvatar } from "#/registry/noyzi-avatar.tsx";
import { NoyziImage } from "#/registry/noyzi-image.tsx";

const BROKEN_IMAGE = "data:image/png;base64,broken";

const AVATARS = [
	{ seed: "noyzi", src: "/logo.webp", alt: "Noyzi", label: "photo" },
	{ seed: "ada@lovelace.dev", fallback: "AL", alt: "Ada", label: "no photo" },
	{ seed: "grace@hopper.dev", fallback: "GH", alt: "Grace", label: "no photo" },
	{
		seed: "linus@torvalds.dev",
		src: BROKEN_IMAGE,
		fallback: "LT",
		alt: "Linus",
		label: "broken link",
	},
	{ seed: "margaret@hamilton.dev", alt: "Margaret", label: "nothing" },
];

const IMAGES = [
	{ src: "/screenshot.webp", alt: "Noyzi gallery", label: "image" },
	{
		src: BROKEN_IMAGE,
		seed: "my-first-post",
		alt: "Missing cover",
		label: "broken link",
	},
];

function Frame({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"rounded-xl border border-border/60 bg-muted/15 px-4 py-6",
				className,
			)}
		>
			{children}
		</div>
	);
}

function Caption({ children }: { children: ReactNode }) {
	return (
		<span className="font-mono text-[11px] text-muted-foreground">
			{children}
		</span>
	);
}

export function AvatarPreview({ className }: { className?: string }) {
	return (
		<Frame className={cn("flex flex-wrap justify-center gap-6", className)}>
			{AVATARS.map(({ label, ...avatar }) => (
				<div key={avatar.seed} className="flex flex-col items-center gap-2">
					<NoyziAvatar {...avatar} className="size-12" />
					<Caption>{label}</Caption>
				</div>
			))}
		</Frame>
	);
}

export function ImagePreview({ className }: { className?: string }) {
	return (
		<Frame className={cn("grid gap-4 sm:grid-cols-2", className)}>
			{IMAGES.map(({ label, ...image }) => (
				<div key={image.src} className="flex flex-col items-center gap-2">
					<NoyziImage
						{...image}
						className="aspect-video w-full rounded-lg"
						imageClassName="object-top"
					/>
					<Caption>{label}</Caption>
				</div>
			))}
		</Frame>
	);
}
