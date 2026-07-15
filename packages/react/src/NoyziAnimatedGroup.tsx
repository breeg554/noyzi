"use client";

import type { GradientSpec } from "@noyzi/core";
import {
	createContext,
	type JSX,
	type ReactNode,
	use,
	useEffect,
	useMemo,
} from "react";
import {
	type SharedAnimatedController,
	SharedAnimatedManager,
	type SharedAnimatedManagerOptions,
	type SharedAnimatedOptions,
} from "./shared-animated.ts";

interface NoyziAnimatedGroupActions {
	observeVisibility(
		canvas: HTMLCanvasElement,
		listener: (visible: boolean) => void,
	): () => void;
	register(
		canvas: HTMLCanvasElement,
		spec: GradientSpec,
		options: SharedAnimatedOptions,
	): Promise<SharedAnimatedController | null>;
}

interface NoyziAnimatedGroupContextValue {
	actions: NoyziAnimatedGroupActions;
	meta: {
		frameRate: number;
		maxPixelRatio: number;
		renderer: "shared-webgl";
	};
}

interface NoyziAnimatedGroupInternalValue
	extends NoyziAnimatedGroupContextValue {
	destroy(): void;
}

const NoyziAnimatedGroupContext =
	createContext<NoyziAnimatedGroupContextValue | null>(null);

export interface NoyziAnimatedGroupProps {
	children: ReactNode;
	frameRate?: number;
	maxPixelRatio?: number;
}

const DEFAULT_FRAME_RATE = 45;
const DEFAULT_MAX_PIXEL_RATIO = 1.25;

function createNoyziAnimatedGroupValue(
	options: SharedAnimatedManagerOptions,
): NoyziAnimatedGroupInternalValue {
	const manager = new SharedAnimatedManager(options);
	return {
		actions: {
			observeVisibility: manager.observeVisibility.bind(manager),
			register: manager.register.bind(manager),
		},
		destroy: manager.destroy.bind(manager),
		meta: manager.meta,
	};
}

/** Groups animated gradients under one managed WebGL renderer pool and scheduler. */
export function NoyziAnimatedGroup({
	children,
	frameRate = DEFAULT_FRAME_RATE,
	maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
}: NoyziAnimatedGroupProps): JSX.Element {
	const value = useMemo(
		() => createNoyziAnimatedGroupValue({ frameRate, maxPixelRatio }),
		[frameRate, maxPixelRatio],
	);

	useEffect(() => () => value.destroy(), [value]);

	return (
		<NoyziAnimatedGroupContext value={value}>
			{children}
		</NoyziAnimatedGroupContext>
	);
}

export function useNoyziAnimatedGroup(): NoyziAnimatedGroupContextValue | null {
	return use(NoyziAnimatedGroupContext);
}
