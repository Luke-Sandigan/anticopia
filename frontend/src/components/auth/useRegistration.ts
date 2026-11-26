import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerAccount } from '../../lib/authApi'
import type { AccountRole } from './RoleTabs'

export function useRegistration(role: AccountRole) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const fields = new FormData(event.currentTarget)
    setError('')
    setPending(true)
    try {
      await registerAccount(role, fields)
      navigate('/signin', { replace: true, state: { registeredRole: role } })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create your account.')
    } finally {
      setPending(false)
    }
  }

  return { error, pending, handleSubmit }
}
