export type BankQuestionType = 'multiple_choice' | 'true_false' | 'essay';
export interface QuestionInput {
  text: string;
  type: BankQuestionType;
  topic?: string;
  options?: string[];
  correctAnswer?: string | boolean; // boolean accepted for true_false
  points: number;
}
export interface BankQuestion {
  id: string;
  text: string;
  type: BankQuestionType;
  topic: string;
  options: string[];
  correctAnswer?: string; // normalized True/False for true_false
  points: number;
  createdAt: string;
  updatedAt: string;
}
export interface QuestionResponse { question: BankQuestion }
export interface QuestionsResponse {
  questions: BankQuestion[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface ExamQuestionIdsInput { questionIds: string[] }
