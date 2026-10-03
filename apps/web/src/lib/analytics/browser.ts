import { analytics } from "../analytics.ts";
import { type AnalyticsConfig, PostHogAdapter } from "./posthog.ts";

let initialization: Promise<void> | undefined;

export function initializeAnalytics(
	config: AnalyticsConfig | null,
): Promise<void> {
	if (typeof window === "undefined") return Promise.resolve();
	if (!config) {
		analytics.configure([]);
		return Promise.resolve();
	}
	initialization ??= import("posthog-js")
		.then(({ default: posthog }) => {
			posthog.init(config.projectToken, {
				api_host: config.host,
				defaults: "2025-05-24",
				autocapture: false,
				capture_pageview: false,
				capture_pageleave: false,
				capture_exceptions: true,
				person_profiles: "identified_only",
				disable_session_recording: false,
				session_recording: {
					maskAllInputs: true,
				},
			});
			analytics.configure([
				new PostHogAdapter(
					(event, properties) => {
						posthog.capture(event, properties);
					},
					(error, properties) => {
						posthog.captureException(error, properties);
					},
				),
			]);
		})
		.catch((error: unknown) => {
			analytics.configure([]);
			initialization = undefined;
			console.warn("Analytics initialization failed", error);
		});
	return initialization;
}
