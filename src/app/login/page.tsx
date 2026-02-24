import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold text-zinc-100">pasta</h1>
        <LoginForm />
      </div>
    </main>
  )
}
