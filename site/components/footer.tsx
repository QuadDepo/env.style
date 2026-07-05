import { GithubIcon } from "@/components/github-icon";
import { GITHUB } from "@/lib/links";

export function Footer() {
	return (
		<footer className="flex items-center justify-between border-t border-border pt-6 font-mono text-xs text-muted-foreground">
			<span>MIT</span>
			<a
				href={GITHUB}
				aria-label="GitHub"
				className="transition-colors hover:text-foreground"
			>
				<GithubIcon className="size-5" />
			</a>
		</footer>
	);
}
