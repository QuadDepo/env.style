import { GithubIcon } from "@/components/github-icon";
import { GITHUB } from "@/lib/links";

export function Header() {
	return (
		<header className="flex items-center justify-between">
			<span className="flex items-center gap-2 font-mono text-sm font-medium">
				<img src="/favicon.svg" alt="" className="size-5" />
				env.style
			</span>
			<nav>
				<a
					href={GITHUB}
					aria-label="GitHub"
					className="text-muted-foreground transition-colors hover:text-foreground"
				>
					<GithubIcon className="size-5" />
				</a>
			</nav>
		</header>
	);
}
