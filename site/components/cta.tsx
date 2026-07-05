import { InstallCommand } from "./install-command";

export function Cta() {
	return (
		<section className="flex flex-col items-center gap-6 py-16">
			<h2 className="text-2xl font-semibold tracking-tight">
				Stop working in the wrong tab
			</h2>
			<p className="text-muted-foreground">
				One dependency. One wrapper. Every environment is easy to spot.
			</p>
			<InstallCommand />
		</section>
	);
}
