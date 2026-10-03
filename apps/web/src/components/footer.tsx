import { analytics } from "#/lib/analytics.ts";
import { playExternalLink } from "#/lib/click-sound.ts";

function Footer() {
	return (
		<footer className="flex items-center justify-center gap-1.5 px-4 py-3 text-[11px] text-muted-foreground">
			<span>© 2026 noyzi</span>
			<span aria-hidden>·</span>
			<a
				href="https://twitter.com/breeg554"
				target="_blank"
				rel="noreferrer"
				onClick={() => {
					playExternalLink();
					analytics.externalLinkClicked(
						"https://twitter.com/breeg554",
						"footer",
					);
				}}
				className="transition-colors hover:text-foreground"
			>
				@breeg554
			</a>
		</footer>
	);
}

export { Footer };
