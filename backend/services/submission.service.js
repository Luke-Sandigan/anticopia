import mongoose from 'mongoose';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';
import { fail, teacherOnly } from './class.service.js';
import { accessExam } from './exam.service.js';

function submissionFilter(id) {
  return mongoose.isObjectIdOrHexString(id) ? { $or: [{ submissionId: id }, { _id: id }] } : { submissionId: id };
}

function answerResponse(answer) {
  return answer.response ?? answer.answer ?? null;
}

function totalPoints(exam) {
  return (exam.questions ?? []).reduce((total, question) => total + question.points, 0);
}

function percentage(submission, exam) {
  const points = submission.totalPoints || totalPoints(exam);
  if (!points) return 0;
  return Number(((submission.totalScore / points) * 100).toFixed(2));
}

function studentSummary(submission, exam, student) {
  return {
    id: submission.submissionId ?? String(submission._id),
    examId: submission.examId,
    studentId: submission.studentId,
    student: student ? {
      id: student.studentId,
      name: `${student.firstName} ${student.lastName}`.trim(),
      email: student.email,
    } : null,
    status: submission.status,
    totalScore: submission.totalScore ?? 0,
    totalPoints: submission.totalPoints || totalPoints(exam),
    percentage: percentage(submission, exam),
    submittedAt: submission.submittedAt ?? null,
    gradedAt: submission.gradedAt ?? null,
  };
}

function questionView(question, includeKey) {
  return {
    id: question.id,
    topic: question.topic ?? '',
    type: question.type,
    question: question.question,
    points: question.points,
    ...(question.choices ? { choices: question.choices } : {}),
    ...(includeKey ? { correctAnswer: question.correctAnswer ?? null } : {}),
  };
}

function answerView(answer, question, includeKey) {
  return {
    id: answer.answerId,
    questionId: answer.questionId,
    response: answerResponse(answer),
    score: answer.score ?? 0,
    feedback: answer.feedback ?? '',
    autoGraded: Boolean(answer.autoGraded),
    question: question ? questionView(question, includeKey) : null,
  };
}

async function findSubmission(id) {
  const submission = await Submission.findOne(submissionFilter(id));
  if (!submission) fail(404, 'Submission not found');
  return submission;
}

async function teacherSubmissionContext(id, user, writable = false) {
  teacherOnly(user);
  const submission = await findSubmission(id);
  const context = await accessExam(submission.examId, user, writable, !writable);
  return { submission, ...context };
}

async function getStudentForSubmission(studentId) {
  return User.findOne({ studentId, role: 'student' }).lean();
}

async function syncGrade(submission, exam) {
  const points = submission.totalPoints || totalPoints(exam);
  if (!points) return null;
  return Grade.findOneAndUpdate(
    { examId: submission.examId, studentId: submission.studentId },
    { $set: { percentage: percentage(submission, exam), released: Boolean(exam.resultsReleased) } },
    { new: true, upsert: true, runValidators: true },
  ).lean();
}

export async function listSubmissions(examId, user, options) {
  teacherOnly(user);
  const context = await accessExam(examId, user, false, true);
  const filter = {
    examId,
    ...(options.status ? { status: options.status } : { status: { $in: ['submitted', 'needs_grading', 'graded'] } }),
  };
  const [items, total] = await Promise.all([
    Submission.find(filter).sort({ submittedAt: -1, createdAt: -1, submissionId: 1 })
      .skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    Submission.countDocuments(filter),
  ]);
  const studentIds = [...new Set(items.map((item) => item.studentId))];
  const students = await User.find({ role: 'student', studentId: { $in: studentIds } }).lean();
  const studentById = new Map(students.map((student) => [student.studentId, student]));
  return {
    submissions: items.map((item) => studentSummary(item, context.item, studentById.get(item.studentId))),
    pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) },
  };
}

export async function getSubmission(id, user) {
  if (user.role === 'teacher') {
    const { submission, item: exam } = await teacherSubmissionContext(id, user);
    const student = await getStudentForSubmission(submission.studentId);
    const questions = new Map((exam.questions ?? []).map((question) => [question.id, question]));
    const grade = await Grade.findOne({ examId: submission.examId, studentId: submission.studentId }).lean();
    return {
      submission: {
        ...studentSummary(submission, exam, student),
        released: Boolean(grade?.released),
        answers: submission.answers.map((answer) => answerView(answer, questions.get(answer.questionId), true)),
      },
    };
  }

  if (user.role !== 'student') fail(403, 'Submission access denied');
  const submission = await findSubmission(id);
  if (submission.studentId !== user.studentId) fail(403, 'You can only read your own submission');
  const { item: exam } = await accessExam(submission.examId, user);
  const grade = await Grade.findOne({ examId: submission.examId, studentId: submission.studentId, released: true }).lean();
  if (!grade) fail(403, 'Results have not been released');
  const questions = new Map((exam.questions ?? []).map((question) => [question.id, question]));
  return {
    submission: {
      ...studentSummary(submission, exam, null),
      released: true,
      answers: submission.answers.map((answer) => answerView(answer, questions.get(answer.questionId), false)),
    },
  };
}

export async function gradeSubmissionAnswer(submissionId, answerId, user, changes) {
  const { submission, item: exam } = await teacherSubmissionContext(submissionId, user, true);
  if (!['submitted', 'needs_grading'].includes(submission.status)) fail(409, 'Submission is already graded or is not submitted');
  const answer = submission.answers.find((item) => item.answerId === answerId);
  if (!answer) fail(404, 'Answer not found');
  const question = (exam.questions ?? []).find((item) => item.id === answer.questionId);
  if (!question) fail(409, 'Answer question is no longer available');

  Object.assign(answer, changes);
  if (changes.score !== undefined) answer.autoGraded = false;
  submission.markModified('answers');
  await submission.save();
  return getSubmission(submission.submissionId, user);
}

export async function finalizeSubmission(id, user) {
  const { submission, item: exam } = await teacherSubmissionContext(id, user, true);
  if (!['submitted', 'needs_grading'].includes(submission.status)) fail(409, 'Submission is already graded or is not submitted');
  submission.status = 'graded';
  submission.gradedAt = new Date();
  await submission.save();
  await syncGrade(submission, exam);
  return getSubmission(submission.submissionId, user);
}

export async function releaseExamResults(examId, user) {
  teacherOnly(user);
  const context = await accessExam(examId, user, true);
  const submissions = await Submission.find({ examId, status: 'graded' });
  const releasedAt = new Date();
  await Exam.updateOne({ examId, archivedAt: null }, { $set: { resultsReleased: true }, $inc: { revision: 1 } });
  const releasedExam = { ...context.item, resultsReleased: true };
  for (const submission of submissions) await syncGrade(submission, releasedExam);
  const result = await Grade.updateMany({ examId }, { $set: { released: true } });
  return { examId, released: true, releasedCount: result.modifiedCount, releasedAt };
}
