"use client";

import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { IconFade } from "./icon-fade";

/** Copy button with cross-faded icon + label so the copied state morphs instead of snapping. */
export function CopyButton({
	copied,
	onCopy,
	subject,
	className,
}: {
	copied: boolean;
	onCopy: () => void;
	/** For the aria-label: "Copy code" / "Copy command". */
	subject: string;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onCopy}
			aria-label={copied ? `Copied ${subject}` : `Copy ${subject}`}
			className={cn(
				"flex items-center gap-1.5 text-xs text-muted-foreground transition-[color,scale] duration-150 hover:text-foreground active:scale-[0.96]",
				className,
			)}
		>
			<span className="relative size-3.5 shrink-0">
				<IconFade show={copied}>
					<Check className="size-full" />
				</IconFade>
				<IconFade show={!copied}>
					<Copy className="size-full" />
				</IconFade>
			</span>
			{/* grid stack keeps the button sized to the widest label — no shift on swap */}
			<span className="grid text-left">
				<span
					className={cn(
						"col-start-1 row-start-1 transition-opacity duration-300",
						copied ? "opacity-100" : "opacity-0",
					)}
				>
					Copied
				</span>
				<span
					className={cn(
						"col-start-1 row-start-1 transition-opacity duration-300",
						copied ? "opacity-0" : "opacity-100",
					)}
				>
					Copy
				</span>
			</span>
		</button>
	);
}

/** ponytail: hand-tinted spans instead of shiki — four static snippets don't earn a highlighter */
export function CodeBlock({
	label,
	actions,
	code,
	children,
	className,
}: {
	label?: ReactNode;
	/** Right-side controls rendered before the copy button. */
	actions?: ReactNode;
	code: string;
	children: ReactNode;
	className?: string;
}) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div
			className={`overflow-hidden rounded-lg border border-border bg-card ${className ?? ""}`}
		>
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<div className="font-mono text-xs text-muted-foreground">{label}</div>
				<div className="flex items-center gap-2">
					{actions}
					<CopyButton copied={copied} onCopy={copy} subject="code" />
				</div>
			</div>
			<pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
				<code>{children}</code>
			</pre>
		</div>
	);
}

export const dim = (text: string) => (
	<span className="text-muted-foreground">{text}</span>
);
