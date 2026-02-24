'use client'

import { useState } from 'react'
import FileMenu from './FileMenu'
import EditForm from './EditForm'
import CodeMirrorEditor from '@/components/editor/CodeMirrorEditor'
import MarkdownPreview from '@/components/editor/MarkdownPreview'
import type { FileWithContent } from '@/types'

const MD_EXTENSIONS = new Set(['md', 'mdx', 'mdc'])

interface Props {
  file: FileWithContent
  isAuthenticated: boolean
}

export default function FileDetail({ file, isAuthenticated }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentFile, setCurrentFile] = useState(file)
  const [viewSource, setViewSource] = useState(false)

  const isMd = MD_EXTENSIONS.has(currentFile.extension)

  function handleEditCancel() {
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
            .{currentFile.extension}
          </span>
          <span className="text-zinc-200 font-mono text-sm truncate">{currentFile.filename}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview / Source toggle — only for md* in read mode */}
          {isMd && !isEditing && (
            <div className="flex rounded border border-zinc-700 overflow-hidden text-xs">
              <button
                onClick={() => setViewSource(false)}
                className={`px-2.5 py-1 transition-colors ${
                  !viewSource
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewSource(true)}
                className={`px-2.5 py-1 transition-colors border-l border-zinc-700 ${
                  viewSource
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Source
              </button>
            </div>
          )}

          {isAuthenticated && !isEditing && (
            <FileMenu hash={currentFile.hash} onEdit={() => setIsEditing(true)} />
          )}
        </div>
      </div>

      {/* Body */}
      {isEditing ? (
        <EditForm file={currentFile} onCancel={handleEditCancel} />
      ) : isMd && !viewSource ? (
        <MarkdownPreview content={currentFile.content} />
      ) : (
        <CodeMirrorEditor
          content={currentFile.content}
          extension={currentFile.extension}
          readOnly={true}
        />
      )}
    </div>
  )
}
