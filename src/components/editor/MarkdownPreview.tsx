'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/atom-one-dark.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)

interface Props {
  content: string
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const match = /language-(\w+)/.exec(className || '')
  const language = match?.[1]
  const code = String(children).replace(/\n$/, '')

  if (language && hljs.getLanguage(language)) {
    const { value } = hljs.highlight(code, { language })
    return (
      <code
        className={`hljs ${className ?? ''}`}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  return <code className={className}>{children}</code>
}

export default function MarkdownPreview({ content }: Props) {
  return (
    <div className="w-full min-h-[400px] overflow-auto rounded border border-zinc-700 bg-zinc-950 px-8 py-7">
      <div className="md-prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          components={{ code: CodeBlock as any }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
