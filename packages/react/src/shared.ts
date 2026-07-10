import type { GenerateOptions, Seed } from "@meshy/core";
import { type ClassValue, clsx } from "clsx";
import type { JSX } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

export const SHADOW_CLASS = "shadow-[0_6px_12px_-6px_rgba(0,0,0,0.4)]";

/** Props shared by every meshy React renderer. */
export interface MeshyBaseProps
	extends Omit<JSX.IntrinsicElements["div"], "children"> {
	seed: Seed;
	options?: GenerateOptions;
}
