import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { Exam } from './exam.model.js';
import { Grade } from './grade.model.js';

// A conservative edit lock: even an in-progress attempt freezes exam settings.
// Lock the parent before inserting so concurrent settings edits use the same
// revision guard. Removing a submission never clears this historical lock.
async function lockExam(examId) {
  const result = await Exam.updateOne({ examId }, { $set: { hasSubmissions: true }, $inc: { revision: 1 } });
  if (!result.matchedCount) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
}

function answerValue(answer) {
  return answer.response ?? answer.answer;
}

function normalizedAnswer(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function calculateTotals(submission, exam) {
  const questions = exam.questions ?? [];
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let totalScore = 0;

  for (const answer of submission.answers) {
    const question = questionById.get(answer.questionId);
    if (!question) continue;

    const objective = question.type === 'Multiple choice' || question.type === 'True/false';
    if (objective && answer.autoGraded !== false) {
      answer.score = normalizedAnswer(answerValue(answer)) === normalizedAnswer(question.correctAnswer) ? question.points : 0;
      answer.autoGraded = true;
    } else if (!objective) {
      answer.autoGraded = false;
    }

    const score = typeof answer.score === 'number' && Number.isFinite(answer.score) ? answer.score : 0;
    totalScore += Math.min(Math.max(score, 0), question.points);
  }

  submission.totalPoints = questions.reduce((total, question) => total + question.points, 0);
  submission.totalScore = totalScore;
  return questions.some((question) => question.type !== 'Multiple choice' && question.type !== 'True/false');
}

const answerSchema = new mongoose.Schema({
  answerId: { type: String, required: true, default: () => randomUUID() },
  questionId: { type: String, required: true },
  response: { type: mongoose.Schema.Types.Mixed, default: null },
  answer: { type: mongoose.Schema.Types.Mixed, default: undefined },
  score: { type: Number, default: 0, min: 0 },
  feedback: { type: String, default: '' },
  autoGraded: Boolean,
}, { _id: false });

const schema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true, index: true, default: () => randomUUID() },
  examId: { type: String, required: true, index: true },
  studentId: { type: String, required: true },
  sessionId: { type: String, default: null },
  status: { type: String, enum: ['in_progress', 'submitted', 'needs_grading', 'graded'], default: 'in_progress' },
  answers: { type: [answerSchema], default: [] },
  totalScore: { type: Number, default: 0, min: 0 },
  totalPoints: { type: Number, default: 0, min: 0 },
  submittedAt: { type: Date, default: null },
  gradedAt: { type: Date, default: null },
}, {
  timestamps: true,
  optimisticConcurrency: true
});
schema.index({ examId: 1, status: 1, submittedAt: -1 });
schema.index({ examId: 1, studentId: 1 }, { unique: true });
schema.pre('save', async function () {
  if (this.isNew) await lockExam(this.examId);
  if (!['submitted', 'needs_grading', 'graded'].includes(this.status)) return;

  const exam = await Exam.findOne({ examId: this.examId }).select('questions').lean();
  if (!exam) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
  const needsManualGrading = calculateTotals(this, exam);
  if (this.status === 'submitted') {
    this.submittedAt ??= new Date();
    this.status = needsManualGrading ? 'needs_grading' : 'graded';
    if (this.status === 'graded') this.gradedAt ??= new Date();
  }
});
schema.post('save', async function (submission) {
  if (submission.status !== 'graded' || !submission.totalPoints) return;
  const exam = await Exam.findOne({ examId: submission.examId }).select('resultsReleased').lean();
  await Grade.findOneAndUpdate(
    { examId: submission.examId, studentId: submission.studentId },
    { $set: {
      percentage: Number(((submission.totalScore / submission.totalPoints) * 100).toFixed(2)),
      released: Boolean(exam?.resultsReleased),
    } },
    { upsert: true, new: true, runValidators: true },
  );
});
schema.pre('insertMany', async function (next, documents) {
  try {
    for (const examId of new Set(documents.map((item) => item.examId))) await lockExam(examId);
    next();
  } catch (error) { next(error); }
});
export const Submission = mongoose.model('Submission', schema);
