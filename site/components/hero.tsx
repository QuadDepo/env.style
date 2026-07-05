import { InstallCommand } from "./install-command";

export function Hero() {
	return (
		<section className="flex flex-col gap-8">
			<h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
				Your environments at a glance
			</h1>
			<p className="max-w-xl text-lg text-muted-foreground">
				Style every environment with colors or custom icons. Never lose track of
				where you are.
			</p>
			<InstallCommand />
		</section>
	);
}
