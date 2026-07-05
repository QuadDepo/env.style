'use client'

import { useEffect, useRef } from 'react'
import { usePlayground } from './provider'

/**
 * Switches the preview to this section (and the env it resolves to) whenever the
 * section crosses the vertical center of the viewport. `resolve` runs at fire time
 * (read via ref) so it isn't a dep — the observer survives icon/color edits.
 * Returning null from `resolve` still switches the section, just not the active env
 * (e.g. no custom icon is set yet).
 */
export function useSectionEnv(section: 'color' | 'icon', resolve: () => string | null) {
  const { actions } = usePlayground()
  const ref = useRef<HTMLDivElement>(null)
  const resolveRef = useRef(resolve)
  resolveRef.current = resolve

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        actions.setActiveSection(section)
        const id = resolveRef.current()
        if (id) actions.setActiveEnv(id)
      },
      // -45% top/bottom leaves a thin band at the viewport's middle, so the callback
      // fires exactly when a section scrolls through the center
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [actions, section])

  return ref
}
