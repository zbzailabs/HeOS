import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { getCurrentUser, signIn } from '../lib/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (user) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const result = await signIn({ data: { email, password } })
      if (!result.ok) {
        setError(result.message)
        return
      }
      await router.navigate({ to: '/' })
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录服务暂不可用')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-wrap grid min-h-[calc(100vh-12rem)] place-items-center px-4 py-12">
      <section className="island-shell w-full max-w-md overflow-hidden rounded-[2rem]">
        <div className="border-b border-[var(--line)] bg-[rgba(79,184,178,0.12)] px-7 py-6">
          <p className="island-kicker mb-2">HeOS Admin</p>
          <h1 className="display-title m-0 text-4xl font-bold text-[var(--sea-ink)]">
            登录云合控制台
          </h1>
          <p className="mb-0 mt-3 text-sm leading-6 text-[var(--sea-ink-soft)]">
            当前版本只允许已配置的管理员账号访问。未授权人员无法进入站内页面。
          </p>
        </div>

        <form className="space-y-5 p-7" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--sea-ink)]">
              管理员邮箱
            </span>
            <input
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-base text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-4 focus:ring-[rgba(79,184,178,0.18)]"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--sea-ink)]">
              密码
            </span>
            <input
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-base text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-4 focus:ring-[rgba(79,184,178,0.18)]"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-2xl border border-[rgba(50,143,151,0.28)] bg-[var(--sea-ink)] px-5 py-3 text-base font-bold text-white shadow-[0_16px_30px_rgba(23,58,64,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>

          <p className="m-0 text-xs leading-5 text-[var(--sea-ink-soft)]">
            登录由 HeOS 应用会话保护，外层访问由 Cloudflare Access 控制。
          </p>
        </form>
      </section>
    </main>
  )
}
