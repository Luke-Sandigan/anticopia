export type QuestionType = 'Multiple choice' | 'True/false' | 'Short answer' | 'Essay'

export interface Question {
  id: string
  topic: string
  type: QuestionType
  question: string
  points: number
  correctAnswer?: string
}

export const starterQuestions: Question[] = [
  { id: 'q-1', topic: 'Arrays', type: 'Multiple choice', question: 'Which structure gives O(1) index access?', points: 2, correctAnswer: 'Array' },
  { id: 'q-2', topic: 'Arrays', type: 'True/false', question: 'A linked list supports random access in O(1).', points: 1, correctAnswer: 'False' },
  { id: 'q-3', topic: 'Stacks', type: 'Short answer', question: 'Name the principle a stack follows.', points: 2, correctAnswer: 'LIFO' },
  { id: 'q-4', topic: 'Trees', type: 'Essay', question: 'Explain how a balanced BST keeps lookups fast.', points: 10 },
]
