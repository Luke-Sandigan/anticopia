import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AccountRole } from '../../components/auth/RoleTabs'
import { signIn } from '../../lib/authApi'

export function useSignInPageLogic() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const registeredRole = state?.registeredRole
  const [role, setRole] = useState<AccountRole>(registeredRole === 'student' ? 'student' : 'teacher')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    // Existing sign-out links return to the sign-in page.
    window.sessionStorage.removeItem('anticopia-auth-token')
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const fields = new FormData(event.currentTarget)
    setError('')
    setPending(true)
    try {
      const { token, user } = await signIn(role, fields)
      window.sessionStorage.setItem('anticopia-auth-token', token)
      navigate(`/${user.role}/dashboard`, { replace: true })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not sign in.')
    } finally {
      setPending(false)
    }
  }

  const justRegistered = registeredRole === 'teacher' || registeredRole === 'student'
  return { role, setRole, error, pending, justRegistered, handleSubmit }
}
