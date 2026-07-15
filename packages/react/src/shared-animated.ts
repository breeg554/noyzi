import {
	type AnimatedCanvas,
	type AnimatedCanvasGroup,
	createAnimatedCanvasGroup,
	type GradientSpec,
} from "@noyzi/core";

export interface SharedAnimatedOptions {
	height: number;
	speed: number;
	strength: number;
	width: number;
}

export interface SharedAnimatedManagerOptions {
	frameRate: number;
	maxPixelRatio: number;
}

interface SharedAnimatedEntry {
	canvas: HTMLCanvasElement;
	destroyed: boolean;
	elapsed: number;
	moving: boolean;
	renderer: AnimatedCanvas;
}

interface InitializationRequest {
	generation: number;
	resolve: (ready: boolean) => void;
}

const INITIALIZATIONS_PER_FRAME = 2;

export interface SharedAnimatedController {
	destroy(): void;
	resize(): boolean;
}

export type SharedAnimatedVisibilityListener = (visible: boolean) => void;

/** Reveals the rendered canvas over its static fallback. */
export function revealAnimatedCanvas(
	canvas: HTMLCanvasElement,
	reducedMotion: boolean,
): void {
	canvas.style.opacity = "1";
	if (!reducedMotion && typeof canvas.animate === "function") {
		canvas.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 850,
			easing: "cubic-bezier(0.4, 0, 0.2, 1)",
		});
	}
}

/** Hides the rendered canvas and restores its static fallback. */
export function hideAnimatedCanvas(canvas: HTMLCanvasElement): void {
	if (typeof canvas.getAnimations === "function") {
		for (const animation of canvas.getAnimations()) {
			animation.cancel();
		}
	}
	canvas.style.opacity = "0";
}

export class SharedAnimatedManager {
	readonly meta: {
		frameRate: number;
		maxPixelRatio: number;
		renderer: "shared-webgl";
	};

	private readonly entries = new Set<SharedAnimatedEntry>();
	private readonly visibilityEntries = new Map<
		HTMLCanvasElement,
		SharedAnimatedVisibilityListener
	>();
	private readonly visibilityRecoveryEntries = new Set<HTMLCanvasElement>();
	private readonly initializationQueue: InitializationRequest[] = [];
	private rendererGroup: AnimatedCanvasGroup | null = null;
	private rendererUnavailable = false;
	private reducedMotion: MediaQueryList | null = null;
	private animationFrame = 0;
	private initializationFrame = 0;
	private visibilityFrame = 0;
	private intersectionObserver: IntersectionObserver | null = null;
	private generation = 0;
	private lastRender = 0;
	private movingEntryCount = 0;

	constructor(options: SharedAnimatedManagerOptions) {
		this.meta = {
			frameRate: this.resolveFrameRate(options.frameRate),
			maxPixelRatio: this.resolvePixelRatio(options.maxPixelRatio),
			renderer: "shared-webgl",
		};
	}

	async register(
		canvas: HTMLCanvasElement,
		spec: GradientSpec,
		options: SharedAnimatedOptions,
	): Promise<SharedAnimatedController | null> {
		this.ensureEnvironment();
		const generation = this.generation;
		if (this.rendererUnavailable) {
			return null;
		}
		if (!(await this.waitForInitializationTurn(generation))) {
			return null;
		}
		if (!this.rendererGroup) {
			this.rendererGroup = createAnimatedCanvasGroup();
			if (!this.rendererGroup) {
				this.rendererUnavailable = true;
				return null;
			}
		}
		const renderer = await this.rendererGroup.register(spec, canvas, {
			...options,
			maxPixelRatio: this.meta.maxPixelRatio,
		});
		if (!renderer) {
			return null;
		}
		if (generation !== this.generation) {
			renderer.destroy();
			return null;
		}

		const entry: SharedAnimatedEntry = {
			canvas,
			destroyed: false,
			elapsed: 0,
			moving: options.speed > 0,
			renderer,
		};
		this.entries.add(entry);
		if (entry.moving) {
			this.movingEntryCount += 1;
		}
		revealAnimatedCanvas(canvas, this.prefersReducedMotion());
		this.start();

		return {
			destroy: () => {
				this.destroyEntry(entry);
				if (this.movingEntryCount === 0) {
					this.stop();
				}
			},
			resize: () => {
				if (entry.destroyed) {
					return false;
				}
				const changed = entry.renderer.resize();
				if (changed) {
					entry.renderer.render(
						this.prefersReducedMotion() ? 0 : entry.elapsed,
					);
				}
				return changed;
			},
		};
	}

	observeVisibility(
		canvas: HTMLCanvasElement,
		listener: SharedAnimatedVisibilityListener,
	): () => void {
		this.visibilityEntries.set(canvas, listener);
		this.visibilityRecoveryEntries.add(canvas);
		this.ensureVisibilityEnvironment();
		this.intersectionObserver?.observe(canvas);
		this.queueVisibilitySync();

		return () => {
			this.intersectionObserver?.unobserve(canvas);
			this.visibilityEntries.delete(canvas);
			this.visibilityRecoveryEntries.delete(canvas);
			if (this.visibilityEntries.size === 0) {
				this.destroyVisibilityEnvironment();
			}
		};
	}

	destroy(): void {
		this.generation += 1;
		this.stop();
		this.destroyInitializationQueue();
		this.destroyVisibilityEnvironment();
		for (const entry of [...this.entries]) {
			this.destroyEntry(entry);
		}
		this.rendererGroup?.destroy();
		this.rendererGroup = null;
		this.rendererUnavailable = false;
		document.removeEventListener(
			"visibilitychange",
			this.handleVisibilityChange,
		);
		this.reducedMotion?.removeEventListener("change", this.handleMotionChange);
		this.reducedMotion = null;
	}

	private destroyEntry(entry: SharedAnimatedEntry): void {
		if (entry.destroyed) {
			return;
		}
		entry.destroyed = true;
		this.entries.delete(entry);
		if (entry.moving) {
			this.movingEntryCount -= 1;
		}
		entry.renderer.destroy();
		hideAnimatedCanvas(entry.canvas);
	}

	private ensureEnvironment(): void {
		if (this.reducedMotion) {
			return;
		}
		this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		this.reducedMotion.addEventListener("change", this.handleMotionChange);
		document.addEventListener("visibilitychange", this.handleVisibilityChange);
	}

	private ensureVisibilityEnvironment(): void {
		if (
			this.intersectionObserver ||
			typeof IntersectionObserver === "undefined"
		) {
			return;
		}
		this.intersectionObserver = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				const canvas = entry.target as HTMLCanvasElement;
				this.visibilityRecoveryEntries.delete(canvas);
				this.visibilityEntries.get(canvas)?.(entry.isIntersecting);
			}
		});
		window.addEventListener("scroll", this.queueVisibilitySync, {
			passive: true,
		});
		window.addEventListener("resize", this.queueVisibilitySync);
		window.addEventListener("pageshow", this.handlePageShow);
	}

	private destroyVisibilityEnvironment(): void {
		if (this.visibilityFrame) {
			cancelAnimationFrame(this.visibilityFrame);
			this.visibilityFrame = 0;
		}
		this.intersectionObserver?.disconnect();
		this.intersectionObserver = null;
		this.visibilityEntries.clear();
		this.visibilityRecoveryEntries.clear();
		window.removeEventListener("scroll", this.queueVisibilitySync);
		window.removeEventListener("resize", this.queueVisibilitySync);
		window.removeEventListener("pageshow", this.handlePageShow);
	}

	private queueVisibilitySync = (): void => {
		if (this.visibilityFrame || this.visibilityRecoveryEntries.size === 0) {
			return;
		}
		this.visibilityFrame = requestAnimationFrame(this.syncVisibility);
	};

	private syncVisibility = (): void => {
		this.visibilityFrame = 0;
		for (const canvas of this.visibilityRecoveryEntries) {
			const listener = this.visibilityEntries.get(canvas);
			if (!listener) {
				continue;
			}
			const rect = canvas.getBoundingClientRect();
			listener(
				rect.width > 0 &&
					rect.height > 0 &&
					rect.bottom > 0 &&
					rect.right > 0 &&
					rect.top < window.innerHeight &&
					rect.left < window.innerWidth,
			);
		}
	};

	private frame = (now: number): void => {
		this.animationFrame = 0;
		if (document.hidden || this.prefersReducedMotion()) {
			return;
		}
		const interval = 1000 / this.meta.frameRate;
		const elapsed = now - this.lastRender;
		if (elapsed >= interval) {
			const delta = Math.min(elapsed / 1000, 0.1);
			this.lastRender = now - (elapsed % interval);
			for (const entry of this.entries) {
				if (entry.moving && !entry.destroyed) {
					entry.elapsed += delta;
					entry.renderer.render(entry.elapsed);
				}
			}
		}
		if (this.movingEntryCount > 0) {
			this.animationFrame = requestAnimationFrame(this.frame);
		}
	};

	private handleMotionChange = (): void => {
		if (this.prefersReducedMotion()) {
			this.stop();
			for (const entry of this.entries) {
				entry.elapsed = 0;
				entry.renderer.render(0);
			}
		} else {
			this.start();
		}
	};

	private handleVisibilityChange = (): void => {
		if (document.hidden) {
			this.stop();
		} else {
			this.start();
		}
	};

	private handlePageShow = (): void => {
		for (const canvas of this.visibilityEntries.keys()) {
			this.visibilityRecoveryEntries.add(canvas);
			this.intersectionObserver?.unobserve(canvas);
			this.intersectionObserver?.observe(canvas);
		}
		this.queueVisibilitySync();
	};

	private prefersReducedMotion(): boolean {
		return this.reducedMotion?.matches ?? false;
	}

	private resolveFrameRate(value: number): number {
		return Math.min(120, Math.max(1, value));
	}

	private resolvePixelRatio(value: number): number {
		return Math.min(2, Math.max(0.5, value));
	}

	private start(): void {
		if (
			this.animationFrame ||
			document.hidden ||
			this.prefersReducedMotion() ||
			this.movingEntryCount === 0
		) {
			return;
		}
		this.lastRender = performance.now();
		this.animationFrame = requestAnimationFrame(this.frame);
	}

	private stop(): void {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
			this.animationFrame = 0;
		}
	}

	private waitForInitializationTurn(generation: number): Promise<boolean> {
		return new Promise((resolve) => {
			this.initializationQueue.push({ generation, resolve });
			this.scheduleInitialization();
		});
	}

	private scheduleInitialization(): void {
		if (this.initializationFrame || this.initializationQueue.length === 0) {
			return;
		}
		this.initializationFrame = requestAnimationFrame(
			this.flushInitializationQueue,
		);
	}

	private flushInitializationQueue = (): void => {
		this.initializationFrame = 0;
		for (let index = 0; index < INITIALIZATIONS_PER_FRAME; index += 1) {
			const request = this.initializationQueue.shift();
			if (!request) {
				break;
			}
			request.resolve(request.generation === this.generation);
		}
		this.scheduleInitialization();
	};

	private destroyInitializationQueue(): void {
		if (this.initializationFrame) {
			cancelAnimationFrame(this.initializationFrame);
			this.initializationFrame = 0;
		}
		for (const request of this.initializationQueue.splice(0)) {
			request.resolve(false);
		}
	}
}
