import { type GenerateOptions, generate, seedHash } from "@noyzi/core";
import { NoyziAnimated, NoyziAnimatedGroup, NoyziGradient } from "@noyzi/react";
import type { CSSProperties, ReactNode } from "react";
import { Toaster as Sonner, type ToasterProps, toast } from "sonner";

const TOAST_ARTWORK = { width: 320, height: 80 };

interface GradientToastOptions {
	animated?: boolean;
	options?: GenerateOptions;
	seed: string;
}

export function gradientToast(
	content: ReactNode,
	{ animated = false, options, seed }: GradientToastOptions,
) {
	const spec = generate(seedHash(seed), options);
	const backgroundClassName =
		"pointer-events-none absolute inset-0 rounded-full shadow-none";
	toast(
		<>
			{animated ? (
				<NoyziAnimated
					aria-hidden
					seed={seed}
					options={options}
					artwork={TOAST_ARTWORK}
					className={backgroundClassName}
					speed={3}
					strength={3}
				/>
			) : (
				<NoyziGradient
					aria-hidden
					seed={seed}
					options={options}
					artwork={TOAST_ARTWORK}
					className={backgroundClassName}
				/>
			)}
			<span className="relative rounded-full text-white backdrop-blur-[2px]">
				{content}
			</span>
		</>,
		{ style: { "--toast-border": spec.background.hex } as CSSProperties },
	);
}

function Toaster(props: ToasterProps) {
	return (
		<NoyziAnimatedGroup frameRate={45} maxPixelRatio={1.25}>
			<Sonner
				className="toaster group"
				position="bottom-center"
				duration={2000}
				style={
					{
						"--normal-bg":
							"color-mix(in oklab, var(--popover) 55%, transparent)",
						"--normal-text": "var(--popover-foreground)",
						"--normal-border":
							"color-mix(in oklab, var(--border) 50%, transparent)",
					} as CSSProperties
				}
				toastOptions={{
					className:
						"rounded-full! shadow-md! backdrop-blur-2xl! backdrop-saturate-150! w-fit! inset-x-0! mx-auto! px-4! py-2! text-xs! justify-center! [transition:transform_400ms,opacity_400ms,height_400ms,box-shadow_200ms,background_600ms_ease,border-color_700ms_ease]!",
				}}
				{...props}
			/>
		</NoyziAnimatedGroup>
	);
}

export { Toaster };
