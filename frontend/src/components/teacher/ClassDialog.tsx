import type { ClassDetails } from '../../data/teacherClasses'
import { useClassDialogLogic } from './ClassDialog.logic'

type ClassDialogProps = {
  mode: 'create' | 'edit'
  initialClass?: ClassDetails
  onClose: () => void
  onSave: (details: Omit<ClassDetails, 'id' | 'code'>) => void
}

export function ClassDialog({ mode, initialClass, onClose, onSave }: ClassDialogProps) {
  const { name, setName, section, setSection, subject, setSubject, term, setTerm, handleSubmit, handleBackdropMouseDown } = useClassDialogLogic(initialClass, onClose, onSave)

  return (
    <div className="class-dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
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
