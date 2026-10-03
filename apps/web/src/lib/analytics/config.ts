import { createServerFn } from "@tanstack/react-start";
import type { AnalyticsConfig } from "./posthog.ts";

export const getAnalyticsConfig = createServerFn({ method: "GET" }).handler(
	(): AnalyticsConfig | null => {
		const projectToken = process.env.POSTHOG_PROJECT_TOKEN;
		const host = process.env.POSTHOG_HOST;
		return projectToken && host ? { projectToken, host } : null;
	},
);
