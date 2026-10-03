import "@tanstack/react-start/server-only";
import { PostHog } from "posthog-node";
import { Analytics } from "../analytics.ts";
import { PostHogAdapter } from "./posthog.ts";

let client: PostHog | undefined;
let instance: Analytics | undefined;

export function getServerAnalytics(): Analytics {
	if (instance) return instance;
	const projectToken = process.env.POSTHOG_PROJECT_TOKEN;
	const host = process.env.POSTHOG_HOST;
	if (!projectToken || !host || process.env.NODE_ENV === "test") {
		return new Analytics([]);
	}
	client = new PostHog(projectToken, {
		host,
		flushAt: 20,
		flushInterval: 5000,
		maxQueueSize: 1000,
		disableGeoip: true,
	});
	client.on("error", (error) =>
		console.warn("Analytics delivery failed", error),
	);
	const stop = () => {
		void shutdownAnalytics()
			.catch((error: unknown) =>
				console.warn("Analytics shutdown failed", error),
			)
			.finally(() => process.exit(0));
	};
	process.once("SIGTERM", stop);
	process.once("SIGINT", stop);
	const posthog = client;
	instance = new Analytics([
		new PostHogAdapter((event, properties, context) => {
			posthog.capture({
				distinctId: context?.distinctId ?? crypto.randomUUID(),
				event,
				properties: {
					...properties,
					$process_person_profile: false,
					source: "server",
				},
			});
		}),
	]);
	return instance;
}

export async function shutdownAnalytics() {
	await client?.shutdown();
}
