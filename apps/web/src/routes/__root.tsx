import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";

import { Footer } from "#/components/footer.tsx";
import { Header } from "#/components/header.tsx";
import { Toaster } from "#/components/ui/sonner.tsx";
import { initializeAnalytics } from "#/lib/analytics/browser.ts";
import { getAnalyticsConfig } from "#/lib/analytics/config.ts";
import { AnalyticsErrorBoundary } from "#/lib/analytics/error-boundary.tsx";
import { analytics } from "#/lib/analytics.ts";
import { createMeta } from "#/lib/meta.ts";
import appCss from "../styles.css?url";

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	loader: async () => ({ analyticsConfig: await getAnalyticsConfig() }),
	head: () => {
		const base = createMeta();
		return {
			...base,
			links: [
				...base.links,
				{
					rel: "stylesheet",
					href: appCss,
				},
			],
			scripts: [
				{
					children: themeScript,
				},
				{
					src: "https://assets.onedollarstats.com/stonks.js",
					defer: true,
				},
			],
		};
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const analyticsConfig = Route.useLoaderData()?.analyticsConfig;
	const projectToken = analyticsConfig?.projectToken;
	const host = analyticsConfig?.host;
	const router = useRouter();

	useEffect(() => {
		void initializeAnalytics(
			projectToken && host ? { projectToken, host } : null,
		);
		const trackPage = () =>
			analytics.pageViewed({
				path: router.state.location.pathname,
				hostname: window.location.hostname,
			});
		trackPage();
		return router.subscribe("onResolved", ({ pathChanged }) => {
			if (pathChanged) trackPage();
		});
	}, [projectToken, host, router]);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-screen flex-col">
				<AnalyticsErrorBoundary>
					<Header />
					<div className="flex-1">{children}</div>
					<Footer />
					<Toaster />
				</AnalyticsErrorBoundary>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
