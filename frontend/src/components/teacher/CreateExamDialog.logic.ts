import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { starterClasses } from '../../data/teacherClasses'

export interface ExamFormData {
  title: string
  classCode: string
  instructions: string
  duration: number
  attemptLimit: number
  availableFrom: string
  availableUntil: string
  allEnrolled: boolean
  excludeExcused: boolean
  randomizeQuestions: boolean
  randomizeChoices: boolean
  allowCalculator: boolean
  allowNotes: boolean
  detectTabSwitches: boolean
  detectCopyPaste: boolean
  requireFullscreen: boolean
  shareStudentScreen: boolean
  autoGradeObjective: boolean
  releaseGradesManually: boolean
}

const defaultForm: ExamFormData = {
  title: '', classCode: starterClasses[0]?.id ?? '', instructions: '', duration: 90, attemptLimit: 1,
  availableFrom: '', availableUntil: '', allEnrolled: true, excludeExcused: false,
  randomizeQuestions: true, randomizeChoices: true, allowCalculator: false, allowNotes: false,
  detectTabSwitches: true, detectCopyPaste: true, requireFullscreen: true, shareStudentScreen: true,
  autoGradeObjective: true, releaseGradesManually: true,
}

type CreateExamDialogCallbacks = {
  onClose: () => void
  onSave: (data: ExamFormData) => void
  onSchedule: (data: ExamFormData) => void
  onPublish: (data: ExamFormData) => void
}

export function useCreateExamDialogLogic({ onClose, onSave, onSchedule, onPublish }: CreateExamDialogCallbacks) {
  const [form, setForm] = useState<ExamFormData>(defaultForm)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function setField<K extends keyof ExamFormData>(key: K, value: ExamFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(form)
  }

  function handleSchedule() { onSchedule(form) }
  function handlePublish() { onPublish(form) }
  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return { form, setField, handleSubmit, handleSchedule, handlePublish, handleBackdropMouseDown }
}
