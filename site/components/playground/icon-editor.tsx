'use client'

import { IconPicker, type IconValue } from '../icon-picker'
import { dim } from '../code-block'
import { ConfigSnippet, TokenShell, TOKEN_TRIGGER_CLASS, type SnippetBlock } from './config-snippet'
import { CONFIG_FILES, usePlayground } from './provider'
import { ENVS } from '../../lib/envs'

// production is never styled — the real `icon` option is a single string, not a per-env map,
// so there's no production row here (mirrors config-editor.tsx's layout)
const ICON_ENVS = ENVS.filter((env) => env.id !== 'production')

export function IconEditor() {
  const { state, actions } = usePlayground()
  const file = state.file

  const lead: SnippetBlock = {
    jsx: () => (
      <>
        {dim("const env = process.env.ENV_STYLES_ENV ?? 'development'")}
        {'\n'}
        {'const envIcons = '}
        {'{\n'}
        {ICON_ENVS.map((env) => (
          <span key={env.id}>
            {'  '}
            {env.id}:{' '}
            <IconToken
              value={state.customIcons[env.id] ?? null}
              label={`${env.id} icon`}
              onChange={(v) => actions.setIcon(env.id, v)}
            />
            {',\n'}
          </span>
        ))}
        {'}'}
      </>
    ),
    source: () =>
      `const env = process.env.ENV_STYLES_ENV ?? 'development'\nconst envIcons = {\n${ICON_ENVS.filter(
        (env) => state.customIcons[env.id],
      )
        .map((env) => `  ${env.id}: '${state.customIcons[env.id]!.path}',`)
        .join('\n')}\n}`,
  }

  const option: SnippetBlock = {
    jsx: (indent: string) => (
      <>
        {indent}
        {'icon: envIcons[env],'}
      </>
    ),
    source: (indent: string) => `${indent}icon: envIcons[env],`,
  }

  return (
    <ConfigSnippet
      label={CONFIG_FILES[file]}
      lead={lead}
      option={option}
      hint="Pick an icon — it's served as-is for that environment, never tinted."
    />
  )
}

function IconToken({
  value,
  label,
  onChange,
}: {
  value: IconValue | null
  label: string
  onChange: (value: IconValue | null) => void
}) {
  return (
    <TokenShell>
      <IconPicker
        icon={value}
        onChange={onChange}
        trigger={
          value ? (
            <img
              role="button"
              tabIndex={0}
              aria-label={label}
              src={value.src}
              alt=""
              className={TOKEN_TRIGGER_CLASS}
            />
          ) : (
            <span role="button" tabIndex={0} aria-label={label} className={`${TOKEN_TRIGGER_CLASS} border-dashed`} />
          )
        }
      />
      {value ? <span className="text-foreground">&apos;{value.path}&apos;</span> : dim('undefined')}
    </TokenShell>
  )
}
