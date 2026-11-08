import { useState } from 'react'

export function useAuthShellLogic() {
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')

  function toggleTheme() {
    setDark((value) => {
      const next = !value
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return { dark, toggleTheme }
}
