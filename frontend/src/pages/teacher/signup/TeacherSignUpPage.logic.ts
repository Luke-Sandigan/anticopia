import { useState, type FormEvent } from 'react'

export function useTeacherSignUpPageLogic() {
  const [notice, setNotice] = useState('')
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('Your teacher account details are ready to submit.')
  }
  return { notice, handleSubmit }
}
