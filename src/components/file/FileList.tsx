import FileCard from './FileCard'
import type { FileMeta } from '@/types'

interface Props {
  files: FileMeta[]
}

export default function FileList({ files }: Props) {
  if (files.length === 0) {
    return (
      <p className="text-zinc-500 text-sm text-center py-8">
        No pastas yet. Drop a file or create one below.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <FileCard key={file.hash} file={file} />
      ))}
    </div>
  )
}
