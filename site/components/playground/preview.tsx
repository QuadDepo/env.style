'use client'

import { useEffect, useState } from 'react'
import { ENVS } from '../../lib/envs'
import { usePlayground } from './provider'

/** Fake browser chrome; clicking a tab retints this page's real favicon. */
export function BrowserPreview() {
  const {
    state: { icons, colors },
  } = usePlayground()
  const [active, setActive] = useState(ENVS[0])
  const activeColor: string | undefined = colors[active.id]

  useEffect(() => {
    // Next emits its own metadata icon link — swap every icon link or the browser may keep the old one
    for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')) {
      link.href = icons[active.id]
    }
  }, [active.id, icons])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-end gap-1 border-b border-border bg-muted px-3 pt-2">
        <div className="mr-2 mb-2.5 flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <div role="tablist" aria-label="Environments" className="flex min-w-0 flex-1 gap-1">
          {ENVS.map((env) => {
            const selected = env.id === active.id
            return (
              <button
                key={env.id}
                role="tab"
                aria-selected={selected}
                aria-label={env.id}
                onClick={() => setActive(env)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 py-2 font-mono text-xs transition-colors sm:justify-start ${
                  selected
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
                }`}
              >
                <img src={icons[env.id]} alt="" className="size-4 shrink-0 rounded-[3px]" />
                <span className="hidden truncate sm:inline">{env.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <img src={icons[active.id]} alt={`${active.id} favicon`} className="size-16 rounded-xl" />
        <p className="font-mono text-sm">
          {active.id}
          {activeColor && <span className="text-muted-foreground"> · {activeColor}</span>}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {activeColor
            ? `Your favicon, tinted ${activeColor}. Look at this page's tab — it just changed too.`
            : 'Production gets your original favicon, byte for byte. env.style adds zero footprint here.'}
        </p>
      </div>
    </div>
  )
}
