import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import type { ClassDetails } from '../../data/teacherClasses'

export function useClassDialogLogic(initialClass: ClassDetails | undefined, onClose: () => void, onSave: (details: Omit<ClassDetails, 'id' | 'code'>) => void) {
  const [name, setName] = useState(initialClass?.name ?? '')
  const [section, setSection] = useState(initialClass?.section ?? '')
  const [subject, setSubject] = useState(initialClass?.subject ?? '')
  const [term, setTerm] = useState(initialClass?.term ?? '')

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ name: name.trim(), section: section.trim(), subject: subject.trim(), term: term.trim() })
  }

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return { name, setName, section, setSection, subject, setSubject, term, setTerm, handleSubmit, handleBackdropMouseDown }
}
