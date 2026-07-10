import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
	return (
		<Sonner
			className="toaster group"
			position="bottom-center"
			duration={2000}
			style={
				{
					"--normal-bg": "color-mix(in oklab, var(--popover) 55%, transparent)",
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
	);
}

export { Toaster };
