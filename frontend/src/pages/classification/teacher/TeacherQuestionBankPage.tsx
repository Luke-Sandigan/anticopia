import { useState, type FormEvent } from 'react'
import { DashboardSidebar } from '../../../components/classification/teacher/DashboardSidebar'
import { starterQuestions, type Question, type QuestionType } from '../../../data/questionBank'

const questionTypes: QuestionType[] = ['Multiple choice', 'True/false', 'Short answer', 'Essay']

function typeClass(type: QuestionType): string {
  switch (type) {
    case 'Multiple choice': return 'qtype-mc'
    case 'True/false': return 'qtype-tf'
    case 'Short answer': return 'qtype-sa'
    case 'Essay': return 'qtype-essay'
    default: return ''
  }
}

export function TeacherQuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(starterQuestions)
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')

  // New question form state
  const [newType, setNewType] = useState<QuestionType>('Multiple choice')
  const [newQuestion, setNewQuestion] = useState('')
  const [newTopic, setNewTopic] = useState('Arrays')
  const [newPoints, setNewPoints] = useState(2)
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('')
  const [randomizeChoices, setRandomizeChoices] = useState(true)

  function toggleTheme() {
    setDark((current) => {
      const next = !current
      window.localStorage.setItem('anticopia-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question: Question = {
      id: `q-${Date.now()}`,
      topic: newTopic.trim(),
      type: newType,
      question: newQuestion.trim(),
      points: newPoints,
      correctAnswer: newCorrectAnswer.trim() || undefined,
    }
    setQuestions((prev) => [...prev, question])
    setNotice(`Question added to "${question.topic}".`)
    setNewQuestion('')
    setNewCorrectAnswer('')
  }

  function removeQuestion(id: string) {
    const q = questions.find((item) => item.id === id)
    setQuestions((prev) => prev.filter((item) => item.id !== id))
    if (q) setNotice(`Removed: "${q.question.slice(0, 40)}…"`)
  }

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
