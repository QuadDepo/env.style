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
  development: null,
  preview: null,
  staging: null,
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
  dirty: boolean
}

interface PlaygroundActions {
  setColor: (id: string, value: string) => void
  /** A custom icon is the user's own env styling — used as-is, never tinted (mirrors the `icon` option). */
  setIcon: (id: string, icon: CustomIcon | null) => void
  setFile: (file: ConfigFile) => void
  reset: () => void
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
  const colorsDirty = Object.keys(DEFAULT_COLORS).some((id) => colors[id] !== DEFAULT_COLORS[id])
  const iconsDirty = Object.values(customIcons).some((icon) => icon != null)
  const dirty = colorsDirty || iconsDirty

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
      reset: () => {
        setColors(DEFAULT_COLORS)
        setCustomIcons(DEFAULT_CUSTOM_ICONS)
      },
    }),
    [],
  )

  // memoized: a fresh object identity here would defeat the value memo below
  const icons = useMemo(
    () =>
      Object.fromEntries(Object.keys(tintedIcons).map((id) => [id, customIcons[id]?.src ?? tintedIcons[id]])),
    [tintedIcons, customIcons],
  )

  const value = useMemo<PlaygroundContextValue>(
    () => ({ state: { colors, customIcons, icons, file, dirty }, actions }),
    [colors, customIcons, icons, file, dirty, actions],
  )

  return <PlaygroundContext value={value}>{children}</PlaygroundContext>
}
