import { InstallCommand } from "./install-command";
import { ConfigEditor } from "./playground/config-editor";
import { IconEditor } from "./playground/icon-editor";
import { BrowserPreview } from "./playground/preview";
import { PlaygroundProvider } from "./playground/provider";

const GITHUB = "https://github.com/QuadDepo/env.style";
const NPM = "https://www.npmjs.com/package/env.style";

export default function App() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16">
      <Header />
      <PlaygroundProvider>
        <main className="mt-8 mb-96 grid items-start gap-10 lg:mt-24 lg:grid-cols-2 lg:gap-20">
          {/* the bottom padding stretches the grid row, so the sticky mock stays pinned past the icon editor */}
          <div className="flex flex-col gap-16 lg:gap-56 lg:pb-110 relative z-10">
            <HeroSection />
            <div className="flex flex-col gap-y-64">
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
                <ConfigEditor />
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
                  <IconEditor />
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none w-screen absolute inset-x-0 -bottom-140 hidden h-200 bg-linear-to-t from-background via-50% via-background to-transparent lg:block"
                />
              </section>
            </div>
          </div>
          {/* pinned to the viewport's bottom-right: full remaining height, width breaking out of the
              centered container to the right edge (container center == viewport center, half gap = 2.5rem) */}
          <aside className="lg:sticky z-0 lg:top-40 lg:h-[calc(100dvh-2.5rem)] lg:w-[calc(50vw-2.5rem)] lg:self-start">
            <BrowserPreview />
          </aside>
        </main>
      </PlaygroundProvider>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between">
      <span className="flex items-center gap-2 font-mono text-sm font-medium">
        <img src="/favicon.svg" alt="" className="size-5" />
        env.style
      </span>
      <nav className="flex gap-4 font-mono text-sm text-muted-foreground">
        <a href={GITHUB} className="transition-colors hover:text-foreground">
          github
        </a>
        <a href={NPM} className="transition-colors hover:text-foreground">
          npm
        </a>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="flex flex-col gap-8">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Your environments at a glance
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        env.style colors your favicon for each environment, so every tab shows
        where you are.
      </p>
      <InstallCommand />
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border pt-6 font-mono text-xs text-muted-foreground">
      <span>MIT</span>
      <span className="flex gap-4">
        <a href={GITHUB} className="transition-colors hover:text-foreground">
          github
        </a>
        <a href={NPM} className="transition-colors hover:text-foreground">
          npm
        </a>
      </span>
    </footer>
  );
}
