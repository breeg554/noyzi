"use client";

import { NoyziGradient } from "@noyzi/react";
import { type ComponentProps, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export interface NoyziAvatarProps
	extends Omit<ComponentProps<"span">, "children"> {
	seed: string;
	src?: string | null;
	alt?: string;
	fallback?: ReactNode;
}

export function NoyziAvatar({
	seed,
	src,
	alt = "",
	fallback,
	className,
	...props
}: NoyziAvatarProps) {
	const [loaded, setLoaded] = useState<string | null>(null);
	const [failed, setFailed] = useState<string | null>(null);
	const hasImage = Boolean(src) && failed !== src;
	const showsImage = hasImage && loaded === src;

	return (
		<span
			data-slot="noyzi-avatar"
			role={alt ? "img" : undefined}
			aria-label={alt || undefined}
			className={cn(
				"relative flex size-8 shrink-0 overflow-hidden rounded-full",
				className,
			)}
			{...props}
		>
			<NoyziGradient
				seed={seed}
				role="presentation"
				aria-hidden
				className="absolute inset-0 size-full shadow-none"
			/>
			{fallback && !showsImage ? (
				<span className="relative m-auto font-medium text-white text-xs [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">
					{fallback}
				</span>
			) : null}
			{hasImage && src ? (
				<img
					key={src}
					src={src}
					alt=""
					ref={(image) => {
						if (image?.complete && image.naturalWidth > 0) setLoaded(src);
					}}
					onLoad={() => setLoaded(src)}
					onError={() => setFailed(src)}
					className={cn(
						"absolute inset-0 size-full object-cover transition-opacity duration-300",
						showsImage ? "opacity-100" : "opacity-0",
					)}
				/>
			) : null}
		</span>
	);
}
