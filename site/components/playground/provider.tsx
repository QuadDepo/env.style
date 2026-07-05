'use client'

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tintFavicon } from '../../lib/tint-client'

export const DEFAULT_COLORS: Record<string, string> = {
  development: '#3b82f6',
  preview: '#f59e0b',
  staging: '#6b7280',
}

// default state serves the committed PNGs — real tintIcon output, not the canvas approximation
const STATIC_ICONS: Record<string, string> = {
  development: '/tints/development.png',
  preview: '/tints/preview.png',
  staging: '/tints/staging.png',
  production: '/tints/production.png',
}

export type CustomIcon = { src: string; path: string }

const DEFAULT_CUSTOM_ICONS: Record<string, CustomIcon | null> = {
  development: { src: '/premade/wrench.svg', path: './wrench.svg' },
  preview: { src: '/premade/eye.svg', path: './eye.svg' },
  staging: { src: '/premade/flask.svg', path: './flask.svg' },
  production: null,
}

export const CONFIG_FILES = { next: 'next.config.ts', vite: 'vite.config.ts' } as const
export type ConfigFile = keyof typeof CONFIG_FILES

interface PlaygroundState {
  colors: Record<string, string>
  /** Custom icon per env, or null when using the default (tinted/static) icon. */
  customIcons: Record<string, CustomIcon | null>
  icons: Record<string, string>
  file: ConfigFile
  /** Env id shown in the preview; driven by scroll section and manual tab clicks. */
  activeEnv: string
  /** Which scroll section is in view; determines whether `icons` shows custom icons or colors only. */
  activeSection: 'color' | 'icon'
}

interface PlaygroundActions {
  setColor: (id: string, value: string) => void
  /** A custom icon is the user's own env styling — used as-is, never tinted (mirrors the `icon` option). */
  setIcon: (id: string, icon: CustomIcon | null) => void
  setFile: (file: ConfigFile) => void
  setActiveEnv: (id: string) => void
  setActiveSection: (section: 'color' | 'icon') => void
}

interface PlaygroundContextValue {
  state: PlaygroundState
  actions: PlaygroundActions
}

const PlaygroundContext = createContext<PlaygroundContextValue | null>(null)

export function usePlayground(): PlaygroundContextValue {
  const ctx = use(PlaygroundContext)
  if (!ctx) throw new Error('usePlayground must be used within <PlaygroundProvider>')
  return ctx
}

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [customIcons, setCustomIcons] = useState(DEFAULT_CUSTOM_ICONS)
  const [tintedIcons, setTintedIcons] = useState(STATIC_ICONS)
  const [file, setFile] = useState<ConfigFile>('next')
  const [activeEnv, setActiveEnv] = useState('development')
  const [activeSection, setActiveSection] = useState<'color' | 'icon'>('color')
  // drives the tint effect below (static PNGs vs live canvas tints), not exposed directly
  const colorsDirty = Object.keys(DEFAULT_COLORS).some((id) => colors[id] !== DEFAULT_COLORS[id])

  useEffect(() => {
    if (!colorsDirty) {
      setTintedIcons(STATIC_ICONS)
      return
    }
    let stale = false
    Promise.all(Object.entries(colors).map(async ([id, c]) => [id, await tintFavicon(c)] as const)).then(
      (tinted) => {
        if (!stale) setTintedIcons({ ...STATIC_ICONS, ...Object.fromEntries(tinted) })
      },
    )
    return () => {
      stale = true
    }
  }, [colors, colorsDirty])

  const actions = useMemo<PlaygroundActions>(
    () => ({
      setColor: (id, value) => setColors((c) => ({ ...c, [id]: value })),
      setIcon: (id, icon) => setCustomIcons((c) => ({ ...c, [id]: icon })),
      setFile,
      setActiveEnv,
      setActiveSection,
    }),
    [],
  )

  // memoized: a fresh object identity here would defeat the value memo below
  // color section ignores custom icons entirely; icon section falls back to tint (mirrors the library)
  const icons = useMemo(
    () =>
      activeSection === 'color'
        ? tintedIcons
        : Object.fromEntries(Object.keys(tintedIcons).map((id) => [id, customIcons[id]?.src ?? tintedIcons[id]])),
    [activeSection, tintedIcons, customIcons],
  )

  const value = useMemo<PlaygroundContextValue>(
    () => ({ state: { colors, customIcons, icons, file, activeEnv, activeSection }, actions }),
    [colors, customIcons, icons, file, activeEnv, activeSection, actions],
  )

  return <PlaygroundContext value={value}>{children}</PlaygroundContext>
}
