'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Sticky aside that pins at the viewport center once scrolled, but never below its natural
 * start — top = min(centered offset, the parent's page offset). Pure CSS can't express this
 * because the centered offset depends on the element's own height, so it's measured.
 */
export function CenteredSticky({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      // the parent grid isn't sticky, so its offset is the aside's natural start position
      const natural = (el.parentElement?.getBoundingClientRect().top ?? 0) + window.scrollY
      const centered = (window.innerHeight - el.offsetHeight) / 2
      el.style.top = `${Math.max(0, Math.min(natural, centered))}px`
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <aside ref={ref} className="lg:sticky lg:self-start">
      {children}
    </aside>
  )
}
