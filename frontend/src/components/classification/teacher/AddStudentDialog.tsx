import { useEffect, useState, type FormEvent } from 'react'

type AddStudentDialogProps = { onClose: () => void; onAdd: (studentIdOrEmail: string) => void }

export function AddStudentDialog({ onClose, onAdd }: AddStudentDialogProps) {
  const [identifier, setIdentifier] = useState('')
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAdd(identifier.trim())
  }

  return <div className="class-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="class-dialog add-student-dialog" role="dialog" aria-modal="true" aria-labelledby="add-student-title">
      <h2 id="add-student-title">Add student</h2>
      <form onSubmit={handleSubmit}>
        <label>Student ID or email<input autoFocus required value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></label>
        <div className="class-dialog-actions"><button type="button" className="class-button secondary" onClick={onClose}>Cancel</button><button type="submit" className="class-button primary">Add student</button></div>
      </form>
    </section>
  </div>
}
