import type { GalleryOptions } from "./gallery-options.ts";

export interface AnalyticsEvents {
	pageViewed: { path: string; hostname: string };
	applicationError: { error: Error; component_stack: string };
	navigationClicked: { destination: string; source: string };
	externalLinkClicked: { destination: string; source: string };
	documentationCodeCopied: { code_language: string };
	installCommandCopied: { package_manager: string; packages: string };
	packageManagerSelected: { package_manager: string };
	gradientComponentCopied: { animated: boolean; source: "gallery" | "docs" };
	gradientImageCopied: { image_format: "png" };
	gradientDownloaded: { image_format: "png" | "webp" };
	galleryOptionsChanged: { changes: Partial<GalleryOptions> };
	galleryFiltersReset: Record<string, never>;
	galleryMoreLoaded: { page: number; item_count: number };
	customSeedChanged: {
		source: "gallery" | "docs" | "output_lab";
		seed_length: number;
	};
	themeChanged: { theme: "dark" | "light" };
	imageServed: {
		hostname: string;
		version: string;
		image_format: string;
		width: number;
		height: number;
		status: number;
		duration_ms: number;
	};
	imageRequestFailed: {
		hostname: string;
		version: string;
		status: number;
		duration_ms: number;
	};
	imageRedirected: { hostname: string; version: string; status: number };
	imageSubdomainRequested: {
		hostname: string;
		method: string;
		status: number;
		duration_ms: number;
	};
}

export type AnalyticsEvent = keyof AnalyticsEvents;

export interface AnalyticsContext {
	distinctId?: string;
}

export interface AnalyticsAdapter {
	capture<E extends AnalyticsEvent>(
		event: E,
		properties: AnalyticsEvents[E],
		context?: AnalyticsContext,
	): void | Promise<void>;
}

export class Analytics {
	private adapters: readonly AnalyticsAdapter[];
	private ready: boolean;
	private pending: Array<() => void> = [];

	constructor(adapters?: readonly AnalyticsAdapter[]) {
		this.adapters = adapters ?? [];
		this.ready = adapters !== undefined;
	}

	configure(adapters: readonly AnalyticsAdapter[]) {
		this.adapters = adapters;
		this.ready = true;
		const pending = this.pending;
		this.pending = [];
		for (const send of pending) send();
	}

	private emit<E extends AnalyticsEvent>(
		event: E,
		properties: AnalyticsEvents[E],
		context?: AnalyticsContext,
	) {
		if (!this.ready) {
			if (this.pending.length === 100) this.pending.shift();
			this.pending.push(() => this.emit(event, properties, context));
			return;
		}
		for (const adapter of this.adapters) {
			try {
				const result = adapter.capture(event, properties, context);
				result?.catch((error: unknown) =>
					console.warn("Analytics capture failed", error),
				);
			} catch (error) {
				console.warn("Analytics capture failed", error);
			}
		}
	}

	pageViewed(properties: AnalyticsEvents["pageViewed"]) {
		this.emit("pageViewed", properties);
	}
	applicationError(error: Error, componentStack: string) {
		this.emit("applicationError", { error, component_stack: componentStack });
	}
	navigationClicked(destination: string, source: string) {
		this.emit("navigationClicked", { destination, source });
	}
	externalLinkClicked(destination: string, source: string) {
		this.emit("externalLinkClicked", { destination, source });
	}
	documentationCodeCopied(language: string) {
		this.emit("documentationCodeCopied", { code_language: language });
	}
	installCommandCopied(packageManager: string, packages: string) {
		this.emit("installCommandCopied", {
			package_manager: packageManager,
			packages,
		});
	}
	packageManagerSelected(packageManager: string) {
		this.emit("packageManagerSelected", { package_manager: packageManager });
	}
	gradientComponentCopied(
		animated: boolean,
		source: "gallery" | "docs" = "gallery",
	) {
		this.emit("gradientComponentCopied", { animated, source });
	}
	gradientImageCopied() {
		this.emit("gradientImageCopied", { image_format: "png" });
	}
	gradientDownloaded(format: "png" | "webp") {
		this.emit("gradientDownloaded", { image_format: format });
	}
	galleryOptionsChanged(changes: Partial<GalleryOptions>) {
		this.emit("galleryOptionsChanged", { changes });
	}
	galleryFiltersReset() {
		this.emit("galleryFiltersReset", {});
	}
	galleryMoreLoaded(page: number, itemCount: number) {
		this.emit("galleryMoreLoaded", { page, item_count: itemCount });
	}
	customSeedChanged(
		source: AnalyticsEvents["customSeedChanged"]["source"],
		seed: string,
	) {
		this.emit("customSeedChanged", { source, seed_length: seed.trim().length });
	}
	themeChanged(theme: "dark" | "light") {
		this.emit("themeChanged", { theme });
	}
	imageServed(
		properties: AnalyticsEvents["imageServed"],
		context?: AnalyticsContext,
	) {
		this.emit("imageServed", properties, context);
	}
	imageRequestFailed(
		properties: AnalyticsEvents["imageRequestFailed"],
		context?: AnalyticsContext,
	) {
		this.emit("imageRequestFailed", properties, context);
	}
	imageRedirected(
		properties: AnalyticsEvents["imageRedirected"],
		context?: AnalyticsContext,
	) {
		this.emit("imageRedirected", properties, context);
	}
	imageSubdomainRequested(
		properties: AnalyticsEvents["imageSubdomainRequested"],
		context?: AnalyticsContext,
	) {
		this.emit("imageSubdomainRequested", properties, context);
	}
}

export const analytics = new Analytics();
