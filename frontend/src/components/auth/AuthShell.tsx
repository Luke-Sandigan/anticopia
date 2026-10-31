import { useState, type ReactNode } from 'react'
import { BrandPanel } from './BrandPanel'
import { ThemeToggle } from './ThemeToggle'

type AuthShellProps = { children: ReactNode }
export function AuthShell({ children }: AuthShellProps) {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')

  function toggleTheme() {
    setDark((value) => {
      const next = !value
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <main className={`auth-shell min-h-screen lg:grid lg:grid-cols-2 ${dark ? 'theme-dark' : ''}`}>
      <BrandPanel />
      <section className="auth-panel flex min-h-[600px] items-center justify-center bg-[#eaf0f7] px-6 py-12 sm:px-10 lg:min-h-screen lg:px-12">
        <div className="w-full max-w-[342px]">
          <div className="mb-5 flex items-center justify-between gap-4"><span aria-hidden="true" className="h-6" /><ThemeToggle dark={dark} onClick={toggleTheme} /></div>
          {children}
        </div>
      </section>
    </main>
  )
}
