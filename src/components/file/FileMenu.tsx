'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  hash: string
  onEdit: () => void
}

export default function FileMenu({ hash, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this pasta?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/files/${hash}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
        router.refresh()
      }
    } finally {
      setDeleting(false)
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button
        onClick={onEdit}
        className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors px-2 py-1"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
