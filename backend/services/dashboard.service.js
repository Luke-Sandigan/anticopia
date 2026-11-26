import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Exam } from '../models/exam.model.js';
import { Flag } from '../models/flag.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';
import { flagType, getExamScoreSummary } from './analytics.service.js';
import { teacherOnly } from './class.service.js';
import { examStatus } from './exam.service.js';

const submittedStatuses = ['submitted', 'needs_grading', 'graded'];
const examPriority = { ongoing: 0, scheduled: 1, draft: 2 };

async function recentAlerts(examIds) {
  const flags = await Flag.find({ examId: { $in: examIds }, status: 'open' })
    .sort({ createdAt: -1, _id: -1 }).limit(3).lean();
  if (!flags.length) return [];
  const students = await User.find({
    role: 'student',
    studentId: { $in: flags.map((flag) => flag.studentId) },
  }).select('studentId firstName lastName').lean();
  const names = new Map(students.map((student) => [
    student.studentId, `${student.firstName} ${student.lastName}`.trim(),
  ]));
  return flags.map((flag) => ({
    id: String(flag._id),
    type: flagType(flag),
    student: names.get(flag.studentId) || flag.studentId,
    details: typeof flag.evidence?.details === 'string' ? flag.evidence.details : null,
    createdAt: flag.createdAt,
  }));
}

async function latestExamSummary(examIds, enrollments) {
  const latest = await Submission.findOne({
    examId: { $in: examIds }, status: { $in: submittedStatuses },
  }).sort({ submittedAt: -1, updatedAt: -1, _id: -1 }).select('examId').lean();
  if (!latest) return null;
  const exam = await Exam.findOne({ examId: latest.examId }).lean();
  if (!exam) return null;
  const studentIds = enrollments
    .filter((enrollment) => enrollment.classId === exam.classId)
    .map((enrollment) => enrollment.studentId);
  const [submitted, scores] = await Promise.all([
    Submission.countDocuments({
      examId: exam.examId, studentId: { $in: studentIds }, status: { $in: submittedStatuses },
    }),
    getExamScoreSummary(exam),
  ]);
  return {
    title: exam.name,
    averageScore: scores.gradedSubmissions ? scores.average : null,
    submitted,
    enrolled: studentIds.length,
  };
}

export async function getTeacherDashboard(user) {
  teacherOnly(user);
  const classes = await Class.find({ teacherId: user.id, status: { $ne: 'archived' } })
    .select('classId name section code').sort({ name: 1, classId: 1 }).lean();
  const classIds = classes.map((item) => item.classId);
  const [enrollments, exams] = await Promise.all([
    Enrollment.find({ classId: { $in: classIds }, enrollment: 'Enrolled' })
      .select('classId studentId').lean(),
    Exam.find({ classId: { $in: classIds }, archivedAt: null })
      .select('examId classId name published startsAt endsAt')
      .sort({ startsAt: 1, name: 1, examId: 1 }).lean(),
  ]);
  const examIds = exams.map((exam) => exam.examId);
  const [awaitingGrading, alerts, summary] = await Promise.all([
    Submission.countDocuments({ examId: { $in: examIds }, status: { $in: ['submitted', 'needs_grading'] } }),
    recentAlerts(examIds),
    latestExamSummary(examIds, enrollments),
  ]);

  const now = new Date();
  const classCodes = new Map(classes.map((item) => [item.classId, item.code]));
  const studentCounts = new Map();
  for (const enrollment of enrollments) {
    studentCounts.set(enrollment.classId, (studentCounts.get(enrollment.classId) ?? 0) + 1);
  }
  const examRows = exams.map((exam) => ({
    id: exam.examId,
    title: exam.name,
    classCode: classCodes.get(exam.classId),
    startsAt: exam.startsAt ?? null,
    status: examStatus(exam, now),
  }));
  return {
    teacherName: `${user.firstName} ${user.lastName}`.trim(),
    stats: {
      classes: classes.length,
      students: new Set(enrollments.map((item) => item.studentId)).size,
      activeExams: examRows.filter((exam) => exam.status === 'ongoing').length,
      awaitingGrading,
    },
    exams: examRows.filter((exam) => exam.status !== 'past')
      .sort((left, right) => examPriority[left.status] - examPriority[right.status]),
    alerts,
    summary,
    classes: classes.map((item) => ({
      id: item.classId,
      name: item.name,
      section: item.section,
      studentCount: studentCounts.get(item.classId) ?? 0,
    })),
  };
}
