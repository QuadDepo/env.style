import { InstallCommand } from "./install-command";

export function Hero() {
	return (
		<section className="flex flex-col gap-8">
			<h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl motion-safe:animate-fade-up">
				Your environments at a glance
			</h1>
			<p className="max-w-xl text-lg text-muted-foreground motion-safe:animate-fade-up [animation-delay:100ms]">
				Style every environment with colors or custom icons. Never lose track of
				where you are.
			</p>
			<div className="motion-safe:animate-fade-up [animation-delay:200ms]">
				<InstallCommand />
			</div>
		</section>
	);
}
