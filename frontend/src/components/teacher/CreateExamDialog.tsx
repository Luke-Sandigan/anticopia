import { starterClasses } from '../../data/teacherClasses'
import { useCreateExamDialogLogic, type ExamFormData } from './CreateExamDialog.logic'

type CreateExamDialogProps = {
  onClose: () => void
  onSave: (data: ExamFormData) => void
  onSchedule: (data: ExamFormData) => void
  onPublish: (data: ExamFormData) => void
}

export function CreateExamDialog({ onClose, onSave, onSchedule, onPublish }: CreateExamDialogProps) {
  const { form, setField, handleSubmit, handleSchedule, handlePublish, handleBackdropMouseDown } = useCreateExamDialogLogic({ onClose, onSave, onSchedule, onPublish })

  return (
    <div className="class-dialog-backdrop" onMouseDown={handleBackdropMouseDown}>
      <section className="exam-dialog" role="dialog" aria-modal="true" aria-labelledby="exam-dialog-title">
        <header className="exam-dialog-header">
          <div>
            <h2 id="exam-dialog-title">Create exam</h2>
            <p>Set it up, then save, schedule, or publish.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="exam-dialog-body">
            {/* Left column — Details */}
            <div className="exam-dialog-details">
              <h3>Details</h3>

              <label className="exam-field">
                <span className="exam-field-label">Exam title</span>
                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Midterm: Data Structures"
                />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Class</span>
                <select value={form.classCode} onChange={(e) => setField('classCode', e.target.value)}>
                  {starterClasses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Instructions</span>
                <textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setField('instructions', e.target.value)}
                  placeholder="Answer all questions. Do not leave the exam tab."
                />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Duration (minutes)</span>
              <input type="number" min={1} value={form.duration} onChange={(e) => setField('duration', Number(e.target.value))} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Attempt limit</span>
              <input type="number" min={1} value={form.attemptLimit} onChange={(e) => setField('attemptLimit', Number(e.target.value))} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Available from</span>
              <input type="datetime-local" value={form.availableFrom} onChange={(e) => setField('availableFrom', e.target.value)} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Available until</span>
              <input type="datetime-local" value={form.availableUntil} onChange={(e) => setField('availableUntil', e.target.value)} />
              </label>
            </div>

            {/* Right column — Options */}
            <div className="exam-dialog-options">
              <fieldset className="exam-option-group">
                <legend>Eligible students</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.allEnrolled} onChange={(e) => setField('allEnrolled', e.target.checked)} /><span>All enrolled students</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.excludeExcused} onChange={(e) => setField('excludeExcused', e.target.checked)} /><span>Exclude excused students</span></label>
              </fieldset>

              <fieldset className="exam-option-group">
                <legend>Randomization and resources</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.randomizeQuestions} onChange={(e) => setField('randomizeQuestions', e.target.checked)} /><span>Randomize question order</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.randomizeChoices} onChange={(e) => setField('randomizeChoices', e.target.checked)} /><span>Randomize answer choices</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.allowCalculator} onChange={(e) => setField('allowCalculator', e.target.checked)} /><span>Allow calculator</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.allowNotes} onChange={(e) => setField('allowNotes', e.target.checked)} /><span>Allow notes</span></label>
              </fieldset>

              <fieldset className="exam-option-group">
                <legend>Monitoring rules</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.detectTabSwitches} onChange={(e) => setField('detectTabSwitches', e.target.checked)} /><span>Detect tab switches</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.detectCopyPaste} onChange={(e) => setField('detectCopyPaste', e.target.checked)} /><span>Detect copy and paste</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.requireFullscreen} onChange={(e) => setField('requireFullscreen', e.target.checked)} /><span>Require fullscreen</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.shareStudentScreen} onChange={(e) => setField('shareStudentScreen', e.target.checked)} /><span>Share student screen</span></label>
              </fieldset>

              <fieldset className="exam-option-group">
                <legend>Grading</legend>
                <label className="exam-checkbox"><input type="checkbox" checked={form.autoGradeObjective} onChange={(e) => setField('autoGradeObjective', e.target.checked)} /><span>Auto-grade objective questions</span></label>
                <label className="exam-checkbox"><input type="checkbox" checked={form.releaseGradesManually} onChange={(e) => setField('releaseGradesManually', e.target.checked)} /><span>Release grades manually</span></label>
              </fieldset>
            </div>
          </div>

          {/* Footer actions */}
          <footer className="exam-dialog-footer">
            <button type="submit" className="class-button secondary">Save draft</button>
            <button type="button" className="class-button secondary" onClick={handleSchedule}>Schedule</button>
            <button type="button" className="class-button primary" onClick={handlePublish}>Publish</button>
            <button type="button" className="exam-cancel-button" onClick={onClose}>Cancel</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
