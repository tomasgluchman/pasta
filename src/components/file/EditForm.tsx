'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUnsavedWarning } from '@/hooks/useUnsavedWarning'
import { extFromFilename } from '@/lib/languages'
import CodeMirrorEditor from '@/components/editor/CodeMirrorEditor'
import LanguageSelect from '@/components/editor/LanguageSelect'
import type { FileWithContent } from '@/types'

interface Props {
  file: FileWithContent
  onCancel: () => void
}

export default function EditForm({ file, onCancel }: Props) {
  const [filename, setFilename] = useState(file.filename)
  const [content, setContent] = useState(file.content)
  const [langOverride, setLangOverride] = useState<string>('auto')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const isDirty = filename !== file.filename || content !== file.content
  useUnsavedWarning(isDirty)

  const currentExt = extFromFilename(filename) || file.extension

  function handleCancel() {
    if (isDirty && !confirm('Discard unsaved changes?')) return
    onCancel()
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/files/${file.hash}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Save failed')
        return
      }
      router.refresh()
      onCancel()
    } catch {
      setError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-zinc-100 text-sm font-mono focus:outline-none focus:border-zinc-500"
        />
        <LanguageSelect value={langOverride} onChange={setLangOverride} />
        <div className="flex items-center gap-2">
          {error && <span className="text-red-400 text-sm">{error}</span>}
          <button
            onClick={handleCancel}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-100 rounded px-3 py-1.5 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <CodeMirrorEditor
          content={content}
          extension={currentExt}
          readOnly={false}
          onChange={setContent}
          langOverride={langOverride}
        />
      </div>
    </div>
  )
}
