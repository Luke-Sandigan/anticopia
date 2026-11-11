import type { Exam as TeacherExamRow } from '../data/teacherExams';
import type { Question } from '../data/questionBank';

export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'past';
export type ExamQuestion = Question & { choices?: string[] };
export interface ExamDetails {
  id: string;
  classId: string;
  classCode: string;
  title: string;
  description: string;
  instructions: string;
  duration: number; // minutes
  passingScore: number; // percentage
  availableFrom: string | null; // ISO timestamp
  availableUntil: string | null;
  published: boolean;
  status: ExamStatus;
  archivedAt: string | null;
  detectTabSwitches: boolean;
  detectMultiDevice: boolean;
  captureScreenshots: boolean;
  questionCount: number;
  questions?: ExamQuestion[]; // owner details only; absent from lists and student responses
  createdAt: string;
  updatedAt: string;
}
export type ExamListItem = Omit<ExamDetails, 'questions'>;
export interface ExamInput {
  title: string;
  description?: string;
  instructions?: string;
  duration?: number;
  passingScore?: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
  detectTabSwitches?: boolean;
  detectMultiDevice?: boolean;
  captureScreenshots?: boolean;
  questions?: ExamQuestion[];
}
export type ExamUpdateInput = Partial<ExamInput>;
export interface ExamResponse { exam: ExamDetails }
export interface ExamsResponse {
  exams: ExamListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface ExamListQuery {
  classId?: string;
  status?: ExamStatus;
  search?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}
export interface ScheduleExamInput { availableFrom: string; availableUntil: string }
export interface ExamApiError { error: string; details?: string[] }

// Keep the current preview table's display contract while adopting the API.
export function toTeacherExamRow(exam: ExamListItem): TeacherExamRow {
  const statuses = { draft: 'Draft', scheduled: 'Scheduled', ongoing: 'Active', past: 'Closed' } as const;
  return {
    id: exam.id, title: exam.title, classCode: exam.classCode,
    when: exam.availableFrom ? new Date(exam.availableFrom).toLocaleString() : '—',
    length: `${exam.duration} min`, status: statuses[exam.status],
  };
}
