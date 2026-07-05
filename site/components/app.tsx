import { InstallCommand } from "./install-command";
import { OptionsGuide } from "./options-guide";
import { ConfigEditor } from "./playground/config-editor";
import { IconEditor } from "./playground/icon-editor";
import { BrowserPreview } from "./playground/preview";
import { PlaygroundProvider } from "./playground/provider";

const GITHUB = "https://github.com/QuadDepo/env.style";

export default function App() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16">
      <Header />
      <PlaygroundProvider>
        <main className="mt-8 grid items-start gap-10 lg:mt-24 lg:grid-cols-2 lg:gap-20">
          {/* the bottom padding stretches the grid row, so the sticky mock stays pinned past the icon editor */}
          <div className="flex flex-col gap-16 lg:gap-70 lg:pb-110 relative z-10">
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
        {/* inside the provider so its framework selector shares the playground's next/vite choice */}
        <OptionsGuide />
      </PlaygroundProvider>
      <ClosingCta />
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

// lucide dropped brand icons, so the official simple-icons path is inlined (mirrors framework-select.tsx)
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function HeroSection() {
  return (
    <section className="flex flex-col gap-8">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Your environments at a glance
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Style every environment with colors or custom icons. Never lose track of where you are.
      </p>
      <InstallCommand />
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="flex flex-col items-center gap-6 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">
        Stop shipping to the wrong tab
      </h2>
      <p className="text-muted-foreground">
        One dependency, one wrapper, every tab labeled.
      </p>
      <InstallCommand />
    </section>
  );
}

function Footer() {
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
