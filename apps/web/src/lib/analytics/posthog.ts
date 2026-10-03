import type {
	AnalyticsAdapter,
	AnalyticsContext,
	AnalyticsEvent,
	AnalyticsEvents,
} from "../analytics.ts";

export interface AnalyticsConfig {
	projectToken: string;
	host: string;
}

export const POSTHOG_EVENTS = {
	pageViewed: "$pageview",
	applicationError: "$exception",
	navigationClicked: "navigation_clicked",
	externalLinkClicked: "external_link_clicked",
	documentationCodeCopied: "documentation_code_copied",
	installCommandCopied: "install_command_copied",
	packageManagerSelected: "package_manager_selected",
	gradientComponentCopied: "gradient_component_copied",
	gradientImageCopied: "gradient_image_copied",
	gradientDownloaded: "gradient_downloaded",
	galleryOptionsChanged: "gallery_options_changed",
	galleryFiltersReset: "gallery_filters_reset",
	galleryMoreLoaded: "gallery_more_loaded",
	customSeedChanged: "custom_seed_changed",
	themeChanged: "theme_changed",
	imageServed: "image_served",
	imageRequestFailed: "image_request_failed",
	imageRedirected: "image_redirected",
	imageSubdomainRequested: "image_subdomain_requested",
} as const satisfies Record<AnalyticsEvent, string>;

type PostHogCapture = (
	event: string,
	properties: Record<string, unknown>,
	context?: AnalyticsContext,
) => void | Promise<void>;

export class PostHogAdapter implements AnalyticsAdapter {
	constructor(
		private readonly send: PostHogCapture,
		private readonly reportException?: (
			error: Error,
			properties: Record<string, unknown>,
		) => void,
	) {}

	capture<E extends AnalyticsEvent>(
		event: E,
		properties: AnalyticsEvents[E],
		context?: AnalyticsContext,
	) {
		if (
			event === "applicationError" &&
			"error" in properties &&
			this.reportException
		) {
			this.reportException(properties.error, {
				component_stack: properties.component_stack,
			});
			return;
		}
		const mapped: Record<string, unknown> = { ...properties };
		if (event === "pageViewed" && "path" in properties) {
			mapped.$pathname = properties.path;
		}
		return this.send(POSTHOG_EVENTS[event], mapped, context);
	}
}
