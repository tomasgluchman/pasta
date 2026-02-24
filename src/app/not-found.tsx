import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-4xl font-semibold text-zinc-100">404</h1>
        <p className="text-zinc-400">Pasta not found.</p>
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          ← Back home
        </Link>
      </div>
    </main>
  )
}
