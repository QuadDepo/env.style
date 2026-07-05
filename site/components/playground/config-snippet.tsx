'use client'

import type { ReactNode } from 'react'
import { CodeBlock, dim } from '../code-block'
import { FrameworkSelect } from './framework-select'
import { CONFIG_FILES, usePlayground } from './provider'

export type SnippetBlock = {
  /** Highlighted JSX for the CodeBlock body. */
  jsx: (indent: string) => ReactNode
  /** Plain string for the copy buffer. */
  source: (indent: string) => string
}

/** Shared inline layout for a picker trigger + its adjacent label/value text. */
export function TokenShell({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 align-middle">{children}</span>
}

export const TOKEN_TRIGGER_CLASS = 'size-3.5 shrink-0 cursor-pointer rounded-[4px] border border-border'

/** Owns the next/vite config-file scaffolding once for both the color and icon editors. */
export function ConfigSnippet({ option }: { option: SnippetBlock }) {
  const { state } = usePlayground()
  const file = state.file

  const code =
    file === 'next'
      ? `import { withEnvStyles } from 'env.style'\n\nexport default withEnvStyles(nextConfig, {\n${option.source('  ')}\n})`
      : `import { envStyle } from 'env.style/vite'\n\nexport default defineConfig({\n  plugins: [\n    react(),\n    envStyle({\n${option.source('      ')}\n    }),\n  ],\n})`

  return (
    <div className="flex flex-col gap-2">
      <CodeBlock label={CONFIG_FILES[file]} actions={<FrameworkSelect />} code={code}>
        {file === 'next' ? (
          <>
            {dim('import { ')}withEnvStyles{dim(" } from 'env.style'")}
            {'\n\n'}
            {dim('export default ')}withEnvStyles(nextConfig, {'{\n'}
            {option.jsx('  ')}
            {'\n})'}
          </>
        ) : (
          <>
            {dim('import { ')}envStyle{dim(" } from 'env.style/vite'")}
            {'\n\n'}
            {dim('export default defineConfig({')}
            {'\n'}
            {dim('  plugins: [\n    react(),\n')}
            {'    '}envStyle({'{\n'}
            {option.jsx('      ')}
            {'\n    }'}){dim(',\n  ],\n})')}
          </>
        )}
      </CodeBlock>
    </div>
  )
}
