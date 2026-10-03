import { Component, type ErrorInfo, type ReactNode } from "react";
import { analytics } from "../analytics.ts";

export class AnalyticsErrorBoundary extends Component<
	{ children: ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		analytics.applicationError(error, info.componentStack ?? "");
	}

	render() {
		return this.state.failed ? (
			<div>Something went wrong. Please try again later.</div>
		) : (
			this.props.children
		);
	}
}
