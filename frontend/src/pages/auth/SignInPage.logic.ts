import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AccountRole } from '../../components/auth/RoleTabs'

export function useSignInPageLogic() {
  const navigate = useNavigate()
  const [role, setRole] = useState<AccountRole>('teacher')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  }

  return { role, setRole, handleSubmit }
}
