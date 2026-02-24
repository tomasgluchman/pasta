'use client'

import { useState, DragEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function DropZone() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function uploadFile(file: File) {
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/files', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Upload failed')
        return
      }
      const { hash } = await res.json()
      router.push(`/${hash}`)
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await uploadFile(file)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await uploadFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg px-6 py-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-zinc-400 bg-zinc-700' : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <p className="text-zinc-400 text-sm">Uploading…</p>
        ) : (
          <>
            <p className="text-zinc-400 text-sm">Drop a file here or click to browse</p>
          </>
        )}
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <NewFileForm />
    </div>
  )
}

function NewFileForm() {
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!filename.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename.trim(), content: '' }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create file')
        return
      }
      const { hash } = await res.json()
      router.push(`/${hash}`)
    } catch {
      setError('Failed to create file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex gap-2">
      <input
        type="text"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        placeholder="new-file.ts"
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
      />
      <button
        type="submit"
        disabled={loading || !filename.trim()}
        className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-100 text-sm rounded px-4 py-2 transition-colors"
      >
        {loading ? 'Creating…' : 'New'}
      </button>
      {error && <p className="text-red-400 text-sm self-center">{error}</p>}
    </form>
  )
}
