"use client";

import { NoyziGradient } from "@noyzi/react";
import { type ComponentProps, useState } from "react";
import { cn } from "@/lib/utils";

export interface NoyziImageProps
	extends Omit<ComponentProps<"img">, "src" | "className"> {
	src: string;
	seed?: string;
	className?: string;
	imageClassName?: string;
}

export function NoyziImage({
	src,
	seed = src,
	alt = "",
	className,
	imageClassName,
	onLoad,
	onError,
	...props
}: NoyziImageProps) {
	const [loaded, setLoaded] = useState<string | null>(null);
	const [failed, setFailed] = useState<string | null>(null);

	return (
		<span
			data-slot="noyzi-image"
			role={failed === src && alt ? "img" : undefined}
			aria-label={failed === src && alt ? alt : undefined}
			className={cn("relative block overflow-hidden", className)}
		>
			<NoyziGradient
				seed={seed}
				role="presentation"
				aria-hidden
				className="absolute inset-0 size-full shadow-none"
			/>
			{failed === src ? null : (
				<img
					key={src}
					src={src}
					alt={alt}
					ref={(image) => {
						if (image?.complete && image.naturalWidth > 0) setLoaded(src);
					}}
					onLoad={(event) => {
						setLoaded(src);
						onLoad?.(event);
					}}
					onError={(event) => {
						setFailed(src);
						onError?.(event);
					}}
					className={cn(
						"relative size-full object-cover transition-opacity duration-500",
						loaded === src ? "opacity-100" : "opacity-0",
						imageClassName,
					)}
					{...props}
				/>
			)}
		</span>
	);
}
