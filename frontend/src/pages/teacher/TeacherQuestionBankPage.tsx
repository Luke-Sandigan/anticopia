import { DashboardSidebar } from '../../components/teacher/DashboardSidebar'
import { questionTypes, typeClass, useTeacherQuestionBankPageLogic } from './TeacherQuestionBankPage.logic'
import type { QuestionType } from '../../data/questionBank'

export function TeacherQuestionBankPage() {
  const { questions, dark, notice, setNotice, newType, setNewType, newQuestion, setNewQuestion, newTopic, setNewTopic, newPoints, setNewPoints, newCorrectAnswer, setNewCorrectAnswer, randomizeChoices, setRandomizeChoices, toggleTheme, addQuestion, removeQuestion } = useTeacherQuestionBankPageLogic()

  return (
    <div className={`teacher-dashboard ${dark ? 'theme-dark' : ''}`}>
      <DashboardSidebar dark={dark} onToggleTheme={toggleTheme} activePage="Question bank" />
      <main className="dashboard-main classes-main">
        <header className="classes-header">
          <div>
            <h1>Question bank</h1>
            <p>Build questions by topic and preview the exam.</p>
          </div>
        </header>

        {notice && <p className="class-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></p>}

        <div className="qbank-layout">
          {/* Questions table panel */}
          <section className="dashboard-panel qbank-panel" aria-label="Questions">
            <div className="qbank-heading">
              <h2>Questions</h2>
              <button type="button" className="qbank-preview-btn">Preview as student</button>
            </div>
            <div className="table-scroll">
              <table className="qbank-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>Question</th>
                    <th>Points</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td>{q.topic}</td>
                      <td><span className={`qtype-badge ${typeClass(q.type)}`}><i />{q.type}</span></td>
                      <td className="qbank-question-cell">{q.question}</td>
                      <td>{q.points}</td>
                      <td>
                        <button type="button" className="table-action" onClick={() => removeQuestion(q.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length === 0 && <p className="no-roster-results">No questions yet. Add one from the panel on the right.</p>}
            </div>
          </section>

          {/* New question form */}
          <aside className="dashboard-panel qbank-form-panel" aria-label="New question">
            <h2>New question</h2>
            <form className="qbank-form" onSubmit={addQuestion}>
              <label className="exam-field">
                <span className="exam-field-label">Type</span>
                <select value={newType} onChange={(e) => setNewType(e.target.value as QuestionType)}>
                  {questionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Question</span>
                <textarea rows={3} required value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Topic</span>
                <input required value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Points</span>
                <input type="number" min={1} required value={newPoints} onChange={(e) => setNewPoints(Number(e.target.value))} />
              </label>

              <label className="exam-field">
                <span className="exam-field-label">Correct answer</span>
                <input value={newCorrectAnswer} onChange={(e) => setNewCorrectAnswer(e.target.value)} />
              </label>

              <label className="exam-checkbox">
                <input type="checkbox" checked={randomizeChoices} onChange={(e) => setRandomizeChoices(e.target.checked)} />
                <span>Randomize answer choices</span>
              </label>

              <button type="submit" className="class-button primary qbank-add-btn">Add question</button>
            </form>
          </aside>
        </div>

        <p className="placeholder-note">Sample question data for preview</p>
      </main>
    </div>
  )
}
