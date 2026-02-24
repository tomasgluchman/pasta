import Link from 'next/link'
import type { FileMeta } from '@/types'

interface Props {
  file: FileMeta
}

export default function FileCard({ file }: Props) {
  const date = new Date(file.created_at + 'Z').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/${file.hash}`}
      className="flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs text-zinc-500 font-mono bg-zinc-700 group-hover:bg-zinc-600 px-1.5 py-0.5 rounded flex-shrink-0">
          .{file.extension}
        </span>
        <span className="text-zinc-200 truncate">{file.filename}</span>
      </div>
      <span className="text-xs text-zinc-500 flex-shrink-0 ml-4">{date}</span>
    </Link>
  )
}
