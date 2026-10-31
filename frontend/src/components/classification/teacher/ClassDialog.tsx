import { useEffect, useState, type FormEvent } from 'react'

export type ClassDetails = {
  id: string
  name: string
  section: string
  subject: string
  term: string
  code: string
}

type ClassDialogProps = {
  mode: 'create' | 'edit'
  initialClass?: ClassDetails
  onClose: () => void
  onSave: (details: Omit<ClassDetails, 'id' | 'code'>) => void
}

export function ClassDialog({ mode, initialClass, onClose, onSave }: ClassDialogProps) {
  const [name, setName] = useState(initialClass?.name ?? '')
  const [section, setSection] = useState(initialClass?.section ?? '')
  const [subject, setSubject] = useState(initialClass?.subject ?? '')
  const [term, setTerm] = useState(initialClass?.term ?? '')

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ name: name.trim(), section: section.trim(), subject: subject.trim(), term: term.trim() })
  }

  return (
    <div className="class-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="class-dialog" role="dialog" aria-modal="true" aria-labelledby="class-dialog-title">
        <h2 id="class-dialog-title">{mode === 'create' ? 'Create class' : 'Edit class'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Class name<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Section<input required value={section} onChange={(event) => setSection(event.target.value)} /></label>
          <label>Subject<input required value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
          <label>Term<input required value={term} onChange={(event) => setTerm(event.target.value)} /></label>
          <div className="class-dialog-actions">
            <button type="button" className="class-button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="class-button primary">Save class</button>
          </div>
        </form>
      </section>
    </div>
  )
}
