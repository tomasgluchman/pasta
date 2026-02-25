import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { readFile } from '@/lib/files'
import { getServerAuthStatus } from '@/lib/auth'
import FileDetail from '@/components/file/FileDetail'
import type { FileMeta, FileWithContent } from '@/types'
import type { Metadata } from 'next'

type Props = { params: Promise<{ hash: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash } = await params
  const db = await getDb()
  const result = await db.execute({
    sql: 'SELECT filename FROM files WHERE hash = ?',
    args: [hash],
  })
  if (result.rows.length === 0) return { title: 'pasta' }
  const { filename } = result.rows[0] as unknown as Pick<FileMeta, 'filename'>
  return { title: `${filename} 🍽️ pasta` }
}

export default async function DetailPage({ params }: Props) {
  const { hash } = await params

  const db = await getDb()
  const result = await db.execute({
    sql: 'SELECT * FROM files WHERE hash = ?',
    args: [hash],
  })

  if (result.rows.length === 0) notFound()

  const meta = result.rows[0] as unknown as FileMeta

  let content = ''
  try {
    content = await readFile(meta.hash, meta.extension)
  } catch {
    content = ''
  }

  const file: FileWithContent = { ...meta, content }
  const isAuthenticated = await getServerAuthStatus()

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
            ← pasta
          </Link>
        </div>
        <FileDetail file={file} isAuthenticated={isAuthenticated} />
      </div>
    </main>
  )
}
