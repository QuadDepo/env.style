'use client'

import { ColorPicker } from '../color-picker'
import { ConfigSnippet, TokenShell, TOKEN_TRIGGER_CLASS, type SnippetBlock } from './config-snippet'
import { CONFIG_FILES, usePlayground, type ConfigFile } from './provider'

export function ConfigEditor() {
  const { state, actions } = usePlayground()
  const file = state.file

  const option: SnippetBlock = {
    jsx: (indent: string) => (
      <>
        {indent}color: {'{\n'}
        {Object.entries(state.colors).map(([id, value]) => (
          <span key={id}>
            {indent}
            {'  '}
            {id}: <ColorToken value={value} label={`${id} color`} onChange={(v) => actions.setColor(id, v)} />
            {',\n'}
          </span>
        ))}
        {indent}
        {'},'}
      </>
    ),
    source: (indent: string) =>
      `${indent}color: {\n${Object.entries(state.colors)
        .map(([id, value]) => `${indent}  ${id}: '${value}',`)
        .join('\n')}\n${indent}},`,
  }

  const fileSelect = (
    <select
      value={file}
      onChange={(e) => actions.setFile(e.target.value as ConfigFile)}
      aria-label="config file"
      className="-mx-1 cursor-pointer rounded-md px-1 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-muted"
    >
      {Object.entries(CONFIG_FILES).map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  )

  return (
    <ConfigSnippet
      label={fileSelect}
      option={option}
      hint={
        <>
          Pick a color — the preview and this page&apos;s real favicon retint live.
          {state.dirty && (
            <>
              {' '}
              <button
                onClick={actions.reset}
                className="underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Reset to defaults
              </button>
            </>
          )}
        </>
      }
    />
  )
}

function ColorToken({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  return (
    <TokenShell>
      <ColorPicker
        color={value}
        onChange={onChange}
        trigger={
          <span
            role="button"
            tabIndex={0}
            aria-label={label}
            style={{ backgroundColor: value }}
            className={TOKEN_TRIGGER_CLASS}
          />
        }
      />
      <span style={{ color: value }}>&apos;{value}&apos;</span>
    </TokenShell>
  )
}
