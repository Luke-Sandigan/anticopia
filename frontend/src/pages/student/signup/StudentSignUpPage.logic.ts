import { useState, type FormEvent } from 'react'

export function useStudentSignUpPageLogic() {
  const [notice, setNotice] = useState('')
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('Your student account details are ready to submit.')
  }
  return { notice, handleSubmit }
}
