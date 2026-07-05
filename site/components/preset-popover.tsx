'use client'

import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export function PresetPopover({
  trigger,
  open,
  onOpenChange,
  children,
}: {
  trigger: ReactElement
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} nativeButton={false} />
      <PopoverContent className="w-44 p-3">{children}</PopoverContent>
    </Popover>
  )
}

export function PresetGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-4 gap-2">{children}</div>
}

export function PresetTile({
  selected,
  onClick,
  'aria-label': ariaLabel,
  round = false,
  checkClassName,
  style,
  children,
}: {
  selected: boolean
  onClick: () => void
  'aria-label': string
  /** Color tiles are fully round; icon tiles use the 4px radius shared with the rest of the UI. */
  round?: boolean
  /** Extra classes for the selected-state check icon (e.g. icon tiles add a dark backdrop). */
  checkClassName?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      style={style}
      className={cn(
        'relative size-8 transition-transform hover:scale-110',
        round ? 'rounded-full' : 'rounded-[4px]',
      )}
      onClick={onClick}
    >
      {children}
      {selected && <Check className={cn('absolute inset-0 m-auto h-4 w-4 text-white', checkClassName)} />}
    </button>
  )
}
