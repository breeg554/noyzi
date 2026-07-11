import type { GenerateOptions, Seed } from "@noyzi/core";
import { type ClassValue, clsx } from "clsx";
import type { JSX } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

export const SHADOW_CLASS = "shadow-[0_6px_12px_-6px_rgba(0,0,0,0.4)]";

/** Props shared by every noyzi React renderer. */
export interface NoyziBaseProps
	extends Omit<JSX.IntrinsicElements["div"], "children"> {
	seed: Seed;
	options?: GenerateOptions;
}
