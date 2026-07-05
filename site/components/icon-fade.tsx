import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One layer of a cross-faded icon pair. Stack two inside a `relative` sized
 * wrapper with opposite `show` values — both stay mounted, so enter and exit
 * both animate (scale 0.25 / blur 4px, the contextual-icon pattern).
 */
export function IconFade({
	show,
	children,
}: {
	show: boolean;
	children: ReactNode;
}) {
	return (
		<span
			aria-hidden={!show}
			className={cn(
				"absolute inset-0 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
				show
					? "scale-100 opacity-100 blur-none"
					: "scale-[0.25] opacity-0 blur-[4px]",
			)}
		>
			{children}
		</span>
	);
}
