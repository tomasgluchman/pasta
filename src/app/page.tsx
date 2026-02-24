import { getDb } from '@/lib/db'
import { getServerAuthStatus } from '@/lib/auth'
import FileList from '@/components/file/FileList'
import DropZone from '@/components/upload/DropZone'
import LogoutButton from '@/components/auth/LogoutButton'
import LoginForm from '@/components/auth/LoginForm'
import type { FileMeta } from '@/types'

export default async function HomePage() {
  const isAuthenticated = await getServerAuthStatus()

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-2xl font-semibold text-zinc-100">pasta</h1>
          <LoginForm />
        </div>
      </main>
    )
  }

  const db = await getDb()
  let files: FileMeta[] = []
  try {
    const result = await db.execute('SELECT * FROM files ORDER BY created_at DESC')
    files = result.rows as unknown as FileMeta[]
  } catch {
    files = []
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">pasta</h1>
          <LogoutButton />
        </div>
        <FileList files={files} />
        <DropZone />
      </div>
    </main>
  )
}
