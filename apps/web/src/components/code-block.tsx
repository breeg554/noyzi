import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Button } from "#/components/ui/button.tsx";

export type CodeLang = "bash" | "typescript" | "tsx";

function CodeBlock({
	code,
	label,
	lang = "tsx",
	className,
}: {
	code: string;
	label: ReactNode;
	lang?: CodeLang;
	className?: string;
}) {
	const [copied, setCopied] = useState(false);
	const [rendered, setRendered] = useState<{
		code: string;
		html: string;
	} | null>(null);

	useEffect(() => {
		let cancelled = false;
		codeToHtml(code, {
			lang,
			themes: { light: "github-light", dark: "github-dark" },
			defaultColor: false,
		}).then((result) => {
			if (!cancelled) {
				setRendered({ code, html: result });
			}
		});
		return () => {
			cancelled = true;
		};
	}, [code, lang]);

	const html = rendered?.code === code ? rendered.html : null;

	const copy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div
			className={`overflow-hidden rounded-lg border border-border/60 bg-card ${className ?? ""}`}
		>
			<div className="flex items-center justify-between border-border/60 border-b py-1 pr-1 pl-4">
				{typeof label === "string" ? (
					<span className="text-muted-foreground text-xs">{label}</span>
				) : (
					label
				)}
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Copy code"
					onClick={copy}
					className="text-muted-foreground hover:bg-foreground/5"
				>
					{copied ? <Check /> : <Copy />}
				</Button>
			</div>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.div
					key={code}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -4 }}
					transition={{ duration: 0.15, ease: "easeOut" }}
				>
					{html ? (
						<div
							className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed [&_pre]:m-0"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is generated locally from our own static strings
							dangerouslySetInnerHTML={{ __html: html }}
						/>
					) : (
						<pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
							<code className="font-mono">{code}</code>
						</pre>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

export { CodeBlock };
