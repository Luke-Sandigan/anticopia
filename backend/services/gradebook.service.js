import mongoose from 'mongoose';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { Submission } from '../models/submission.model.js';
import { accessibleClass, fail, teacherOnly } from './class.service.js';

function gradeFilter(id) {
  return mongoose.isObjectIdOrHexString(id) ? { $or: [{ gradeId: id }, { _id: id }] } : { gradeId: id };
}

function round(value) {
  return Number(value.toFixed(2));
}

function publicExam(exam) {
  return {
    id: exam.examId,
    title: exam.name,
    totalPoints: (exam.questions ?? []).reduce((total, question) => total + question.points, 0),
  };
}

function publicGrade(grade) {
  return {
    id: grade.gradeId ?? String(grade._id),
    examId: grade.examId,
    studentId: grade.studentId,
    percentage: grade.percentage,
    released: grade.released,
    overrides: (grade.overrides ?? []).map((override) => ({
      previousPercentage: override.previousPercentage,
      percentage: override.percentage,
      reason: override.reason,
      overriddenBy: override.overriddenBy,
      overriddenAt: override.overriddenAt,
    })),
    updatedAt: grade.updatedAt,
  };
}

export async function getGradebook(classId, user) {
  teacherOnly(user);
  const classItem = await accessibleClass(classId, user);
  const [enrollments, exams] = await Promise.all([
    Enrollment.find({ classId, enrollment: 'Enrolled' }).sort({ name: 1, studentId: 1 }).lean(),
    Exam.find({ classId, archivedAt: null }).sort({ startsAt: 1, name: 1, examId: 1 }).lean(),
  ]);
  const examIds = exams.map((exam) => exam.examId);
  const studentIds = enrollments.map((enrollment) => enrollment.studentId);
  const gradedSubmissions = await Submission.find({
    examId: { $in: examIds },
    studentId: { $in: studentIds },
    status: 'graded',
  }).select('examId studentId').lean();
  const gradedKeys = new Set(gradedSubmissions.map((submission) => `${submission.examId}:${submission.studentId}`));
  const grades = await Grade.find({ examId: { $in: examIds }, studentId: { $in: studentIds } }).lean();
  const gradeByKey = new Map(grades
    .filter((grade) => gradedKeys.has(`${grade.examId}:${grade.studentId}`))
    .map((grade) => [`${grade.examId}:${grade.studentId}`, grade]));

  return {
    class: { id: classItem.classId, name: classItem.name, section: classItem.section, subject: classItem.subject, term: classItem.term },
    exams: exams.map(publicExam),
    rows: enrollments.map((enrollment) => {
      const gradesByExam = Object.fromEntries(exams.map((exam) => {
        const grade = gradeByKey.get(`${exam.examId}:${enrollment.studentId}`);
        return [exam.examId, grade ? publicGrade(grade) : null];
      }));
      const values = Object.values(gradesByExam).filter(Boolean).map((grade) => grade.percentage);
      return {
        student: { id: enrollment.studentId, name: enrollment.name, email: enrollment.email ?? null },
        grades: gradesByExam,
        average: values.length ? round(values.reduce((total, value) => total + value, 0) / values.length) : null,
      };
    }),
  };
}

export async function overrideGrade(gradeId, user, override) {
  teacherOnly(user);
  const grade = await Grade.findOne(gradeFilter(gradeId)).lean();
  if (!grade) fail(404, 'Grade not found');
  const exam = await Exam.findOne({ examId: grade.examId }).lean();
  if (!exam) fail(404, 'Exam not found');
  await accessibleClass(exam.classId, user, true);
  const submission = await Submission.exists({ examId: grade.examId, studentId: grade.studentId, status: 'graded' });
  if (!submission) fail(409, 'Only graded submissions can be overridden');

  const overriddenAt = new Date();
  const updated = await Grade.findOneAndUpdate(
    { _id: grade._id },
    {
      $set: { percentage: override.percentage },
      $push: { overrides: {
        previousPercentage: grade.percentage,
        percentage: override.percentage,
        reason: override.reason,
        overriddenBy: user.id,
        overriddenAt,
      } },
    },
    { new: true, runValidators: true },
  ).lean();
  return publicGrade(updated);
}

function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function gradebookCsv(gradebook) {
  const header = ['Student ID', 'Student', ...gradebook.exams.map((exam) => exam.title), 'Average'];
  const rows = gradebook.rows.map((row) => [
    row.student.id,
    row.student.name,
    ...gradebook.exams.map((exam) => row.grades[exam.id]?.percentage ?? ''),
    row.average ?? '',
  ]);
  return `\ufeff${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
