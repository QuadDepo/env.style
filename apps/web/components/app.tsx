import { Cta } from "@/components/cta";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ColorEditor } from "./demo/color-editor";
import { IconEditor } from "./demo/icon-editor";
import { BrowserPreview, MiniBrowserPreview } from "./demo/preview";
import { DemoProvider } from "./demo/provider";
import { OptionsGuide } from "./options-guide";

export default function App() {
	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16">
			<Header />
			<DemoProvider>
				<main className="mt-8 grid items-start gap-10 lg:mt-24 lg:grid-cols-2 lg:gap-20">
					{/* the bottom padding stretches the grid row, so the sticky mock stays pinned past the icon editor */}
					{/* min-w-0: keep intrinsically wide children (tab strips, code) from stretching the grid track */}
					<div className="flex min-w-0 flex-col gap-16 lg:gap-70 lg:pb-110 relative z-10">
						<Hero />
						{/* the big lg gap paces the sticky preview's scroll travel; mobile has no preview to pace */}
						<div className="flex flex-col gap-y-24 lg:gap-y-64">
							<section className="flex flex-col gap-8">
								<div className="flex flex-col gap-3">
									<h2 className="text-2xl font-semibold tracking-tight">
										Color each environment
									</h2>
									<p className="max-w-xl text-muted-foreground">
										Choose a color for each environment. The preview updates
										live as you edit.
									</p>
								</div>
								{/* strip + editor share a wrapper so the section gap doesn't split them — they read as one card on mobile */}
								<div>
									<div className="lg:hidden">
										<MiniBrowserPreview section="color" />
									</div>
									<ColorEditor />
								</div>
							</section>
							<section className="flex flex-col gap-8 relative">
								<div className="flex flex-col gap-8 relative z-10">
									<div className="flex flex-col gap-3">
										<h2 className="text-2xl font-semibold tracking-tight">
											Use custom icons
										</h2>
										<p className="max-w-xl text-muted-foreground">
											Set a custom icon for any environment. Missing icons fall
											back to color tints.
										</p>
									</div>
									<div>
										<div className="lg:hidden">
											<MiniBrowserPreview section="icon" />
										</div>
										<IconEditor />
									</div>
								</div>
								<div
									aria-hidden
									className="pointer-events-none w-screen absolute inset-x-0 -bottom-140 hidden h-200 bg-linear-to-t from-background via-50% via-background to-transparent lg:block"
								/>
							</section>
						</div>
					</div>
					{/* pinned to the viewport's bottom-right: width breaking out of the centered container to the
              right edge (container center == viewport center, half gap = 2.5rem). Height is capped at
              54rem so the skeleton content doesn't stretch into a giant empty shell on tall viewports;
              top then switches from the fixed 10rem to 100dvh-46.5rem so the mock keeps hugging the
              bottom edge (bottom = top + height = 100dvh + 7.5rem, same as the uncapped case) once the
              cap kicks in — the two expressions agree at a 904px-tall viewport */}
					<aside className="hidden lg:block lg:sticky z-0 lg:top-[max(10rem,calc(100dvh-46.5rem))] lg:h-[min(calc(100dvh-2.5rem),54rem)] lg:w-[calc(50vw-2.5rem)] lg:self-start">
						<BrowserPreview />
					</aside>
				</main>
				{/* inside the provider so its framework selector shares the demo's framework choice */}
				<OptionsGuide />
			</DemoProvider>
			<Cta />
			<Footer />
		</div>
	);
}
