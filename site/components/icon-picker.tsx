'use client'

import { useState, type ReactElement } from 'react'
import { X } from 'lucide-react'
import { PresetGrid, PresetPopover, PresetTile } from './preset-popover'

// mirrors color-picker.tsx: presets-only popover, swapped for premade icon tiles
const PREMADE_ICONS = ['wrench', 'flask', 'eye', 'rocket'].map((name) => ({
  name,
  src: `/premade/${name}.svg`,
  path: `./${name}.svg`,
}))

export type IconValue = { src: string; path: string }

export function IconPicker({
  icon,
  onChange,
  trigger,
}: {
  icon: IconValue | null
  onChange: (value: IconValue | null) => void
  /** Element that opens the picker (e.g. an inline token). */
  trigger: ReactElement
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <PresetPopover trigger={trigger} open={isOpen} onOpenChange={setIsOpen}>
      <PresetGrid>
        {PREMADE_ICONS.map((preset) => (
          <PresetTile
            key={preset.name}
            aria-label={`use ${preset.name} icon`}
            selected={icon?.path === preset.path}
            checkClassName="rounded-[4px] bg-black/40"
            onClick={() => {
              onChange({ src: preset.src, path: preset.path })
              setIsOpen(false)
            }}
          >
            <img src={preset.src} alt="" className="size-full rounded-[4px]" />
          </PresetTile>
        ))}
      </PresetGrid>
      {icon && (
        <button
          type="button"
          onClick={() => {
            onChange(null)
            setIsOpen(false)
          }}
          className="mt-2 flex w-full items-center gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
          Remove icon
        </button>
      )}
    </PresetPopover>
  )
}
