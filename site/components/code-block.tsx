'use client'

import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

/** ponytail: hand-tinted spans instead of shiki — four static snippets don't earn a highlighter */
export function CodeBlock({
  label,
  actions,
  code,
  children,
}: {
  label?: ReactNode
  /** Right-side controls rendered before the copy button. */
  actions?: ReactNode
  code: string
  children: ReactNode
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="font-mono text-xs text-muted-foreground">{label}</div>
        <div className="flex items-center gap-2">
          {actions}
          {/* mirrors the install block's copy button (code-block-command.tsx) */}
          <button
            onClick={copy}
            aria-label={copied ? 'Copied code' : 'Copy code'}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export const dim = (text: string) => <span className="text-muted-foreground">{text}</span>
