'use client'

import { useRef, useState, type ReactElement } from 'react'
import { Upload, X } from 'lucide-react'
import { PresetGrid, PresetPopover, PresetTile } from './preset-popover'

// mirrors color-picker.tsx: presets-only popover, swapped for premade icon tiles + upload
const PREMADE_ICONS = ['wrench', 'flask', 'eye', 'rocket'].map((name) => ({
  name,
  src: `/premade/${name}.svg`,
  path: `./${name}.svg`,
}))

const MAX_FILE_BYTES = 1024 * 1024

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image must be under 1MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ src: reader.result, path: `./${file.name}` })
        setIsOpen(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <PresetPopover
      trigger={trigger}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) setError(null)
      }}
    >
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
        <button
          type="button"
          aria-label="upload custom icon"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-8 items-center justify-center rounded-[4px] border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Upload className="size-3.5" />
        </button>
      </PresetGrid>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
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
