import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'

export function useAddStudentDialogLogic(onClose: () => void, onAdd: (studentIdOrEmail: string) => void) {
  const [identifier, setIdentifier] = useState('')

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAdd(identifier.trim())
  }

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return { identifier, setIdentifier, handleSubmit, handleBackdropMouseDown }
}
