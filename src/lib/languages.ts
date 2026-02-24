import type { Extension } from '@codemirror/state'

export const SUPPORTED_LANGUAGES = [
  { label: 'Auto-detect', value: 'auto' },
  { label: 'JavaScript', value: 'js' },
  { label: 'JSX', value: 'jsx' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'TSX', value: 'tsx' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'py' },
  { label: 'Markdown', value: 'md' },
  { label: 'MDX', value: 'mdx' },
  { label: 'Plain text', value: 'txt' },
] as const

export type LangValue = typeof SUPPORTED_LANGUAGES[number]['value']

export async function getLanguageExtension(ext: string): Promise<Extension | null> {
  const normalized = ext.toLowerCase().replace(/^\./, '')

  switch (normalized) {
    case 'js':
    case 'jsx': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript({ jsx: true })
    }
    case 'ts':
    case 'tsx': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript({ typescript: true, jsx: true })
    }
    case 'css': {
      const { css } = await import('@codemirror/lang-css')
      return css()
    }
    case 'py': {
      const { python } = await import('@codemirror/lang-python')
      return python()
    }
    case 'md':
    case 'mdx':
    case 'mdc': {
      const { markdown } = await import('@codemirror/lang-markdown')
      return markdown()
    }
    default:
      return null
  }
}

export function extFromFilename(filename: string): string {
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  return parts[parts.length - 1].toLowerCase()
}
