import { CenteredSticky } from './centered-sticky'
import { InstallCommand } from './install-command'
import { ConfigEditor } from './playground/config-editor'
import { IconEditor } from './playground/icon-editor'
import { BrowserPreview } from './playground/preview'
import { PlaygroundProvider } from './playground/provider'

const GITHUB = 'https://github.com/QuadDepo/env.style'
const NPM = 'https://www.npmjs.com/package/env.style'

export default function App() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16">
      <Header />
      <PlaygroundProvider>
        <main className="mt-8 mb-96 grid items-start gap-10 lg:mt-24 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-16 lg:gap-56">
            <HeroSection />
            <div className="flex flex-col gap-y-64">
              <section className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight">Tint by environment</h2>
                  <p className="max-w-xl text-muted-foreground">
                    Pick a color per environment — the preview and this page&apos;s real favicon
                    retint live. Production is never touched.
                  </p>
                </div>
                <ConfigEditor />
              </section>
              <section className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight">Or bring your own icons</h2>
                  <p className="max-w-xl text-muted-foreground">
                    Set an icon per environment and it&apos;s served as-is, never tinted. Any
                    environment you leave out falls back to the tint.
                  </p>
                </div>
                <IconEditor />
              </section>
            </div>
          </div>
          <CenteredSticky>
            <BrowserPreview />
          </CenteredSticky>
        </main>
      </PlaygroundProvider>
      <Footer />
    </div>
  )
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
  )
}

function HeroSection() {
  return (
    <section className="flex flex-col gap-8">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Which of these tabs is production?
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Five tabs, one favicon — and you keep editing the wrong one. env.style tints your
        existing favicon per environment at build time. Same mark, different color.
        Production is never touched.
      </p>
      <InstallCommand />
    </section>
  )
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
  )
}
