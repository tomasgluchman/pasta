'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

export default function MarkdownPreview({ content }: Props) {
  return (
    <div className="w-full min-h-[400px] overflow-auto rounded border border-zinc-700 bg-zinc-950 px-8 py-7">
      <div className="md-prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
