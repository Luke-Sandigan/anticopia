import { useState, type FormEvent } from 'react'
import { starterQuestions, type Question, type QuestionType } from '../../data/questionBank'

export const questionTypes: QuestionType[] = ['Multiple choice', 'True/false', 'Short answer', 'Essay']
export function typeClass(type: QuestionType): string {
  switch (type) {
    case 'Multiple choice': return 'qtype-mc'
    case 'True/false': return 'qtype-tf'
    case 'Short answer': return 'qtype-sa'
    case 'Essay': return 'qtype-essay'
    default: return ''
  }
}

export function useTeacherQuestionBankPageLogic() {
  const [questions, setQuestions] = useState<Question[]>(starterQuestions)
  const [dark, setDark] = useState(() => window.localStorage.getItem('anticopia-theme') === 'dark')
  const [notice, setNotice] = useState('')
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
    const question: Question = { id: `q-${Date.now()}`, topic: newTopic.trim(), type: newType, question: newQuestion.trim(), points: newPoints, correctAnswer: newCorrectAnswer.trim() || undefined }
    setQuestions((previous) => [...previous, question])
    setNotice(`Question added to "${question.topic}".`)
    setNewQuestion('')
    setNewCorrectAnswer('')
  }
  function removeQuestion(id: string) {
    const question = questions.find((item) => item.id === id)
    setQuestions((previous) => previous.filter((item) => item.id !== id))
    if (question) setNotice(`Removed: "${question.question.slice(0, 40)}…"`)
  }

  return { questions, dark, notice, setNotice, newType, setNewType, newQuestion, setNewQuestion, newTopic, setNewTopic, newPoints, setNewPoints, newCorrectAnswer, setNewCorrectAnswer, randomizeChoices, setRandomizeChoices, toggleTheme, addQuestion, removeQuestion }
}
