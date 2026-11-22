import { User } from '../models/user.model.js';
import { Grade } from '../models/grade.model.js';
import { Exam } from '../models/exam.model.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Submission } from '../models/submission.model.js';

function fail(statusCode, message) {
  throw Object.assign(new Error(message), { statusCode });
}

export async function getStudentGrades(user, classId) {
  if (user.role !== 'student') {
    fail(403, 'Student access required');
  }

  const enrollments = await Enrollment.find({
    userId: user.id,
    enrollment: 'Enrolled'
  }).select('classId').lean();

  const enrolledClassIds = enrollments.map(e => e.classId);

  if (classId && !enrolledClassIds.includes(classId)) {
    fail(403, 'You are not enrolled in this class');
  }

  const exams = await Exam.find({
    classId: classId
      ? classId
      : { $in: enrolledClassIds },
    archivedAt: null
  }).lean();

  const examIds = exams.map(e => e.examId);

  const grades = await Grade.find({
    examId: { $in: examIds },
    studentId: user.studentId,
    released: true
  }).lean();

  const gradedSubmissions = await Submission.find({
    examId: { $in: examIds },
    studentId: user.studentId,
    status: 'graded'
  }).select('examId').lean();

  const gradedIds = new Set(
    gradedSubmissions.map(s => s.examId)
  );

  const examMap = new Map(
    exams.map(e => [e.examId, e])
  );

  const gradeItems = grades
    .filter(g => gradedIds.has(g.examId))
    .map(g => {
      const exam = examMap.get(g.examId);

      return {
        gradeId: g.gradeId,
        examId: g.examId,
        examTitle: exam?.name ?? 'Unknown exam',
        classId: exam?.classId,
        percentage: g.percentage,
        released: g.released,
        gradedAt: g.updatedAt
      };
    });

  const classIds = [...new Set(
    gradeItems.map(g => g.classId)
  )];

  const classes = await Class.find({
    classId: { $in: classIds }
  }).lean();

  const classMap = new Map(
    classes.map(c => [c.classId, c])
  );

  const grouped = {};

  for (const grade of gradeItems) {
    const classItem = classMap.get(grade.classId);

    if (!grouped[grade.classId]) {
      grouped[grade.classId] = {
        classId: grade.classId,
        className: classItem?.name ?? 'Unknown class',
        grades: []
      };
    }

    grouped[grade.classId].grades.push(grade);
  }

  const values = gradeItems.map(g => g.percentage);

  const average = values.length
    ? Number((
        values.reduce((sum, value) => sum + value, 0) /
        values.length
      ).toFixed(2))
    : null;

  return {
    classes: Object.values(grouped),
    overallAverage: average,
    totalGrades: values.length
  };
}


export async function getExamHistory(user, filters = {}) {
  if (user.role !== 'student') {
    fail(403, 'Student access required');
  }

  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const limit = 10;

  const enrollments = await Enrollment.find({
    userId: user.id,
    enrollment: 'Enrolled'
  }).select('classId').lean();

  const classIds = enrollments.map(e => e.classId);

  if (filters.classId && !classIds.includes(filters.classId)) {
    fail(403, 'You are not enrolled in this class');
  }

  const exams = await Exam.find({
    classId: filters.classId
      ? filters.classId
      : { $in: classIds },
    archivedAt: null
  }).lean();

  const examIds = exams.map(e => e.examId);

  const filter = {
    studentId: user.studentId,
    examId: { $in: examIds },
    status: { $in: ['submitted', 'needs_grading', 'graded'] }
  };

  if (filters.status) {
    if (!['submitted', 'needs_grading', 'graded'].includes(filters.status)) {
      fail(400, 'Invalid status filter');
    }
    filter.status = filters.status;
  }

  const [attempts, total] = await Promise.all([
    Submission.find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Submission.countDocuments(filter)
  ]);

  const examMap = new Map(
    exams.map(e => [e.examId, e])
  );

  const grades = await Grade.find({
    examId: { $in: attempts.map(a => a.examId) },
    studentId: user.studentId,
    released: true
  }).lean();

  const gradeMap = new Map(
    grades.map(g => [g.examId, g])
  );

  const classItems = await Class.find({
    classId: { $in: classIds }
  }).lean();

  const classMap = new Map(
    classItems.map(c => [c.classId, c])
  );

  return {
    attempts: attempts.map(attempt => {
      const exam = examMap.get(attempt.examId);
      const grade = gradeMap.get(attempt.examId);
      const classItem = classMap.get(exam?.classId);

      return {
        attemptId: attempt.submissionId,
        examTitle: exam?.name ?? 'Unknown exam',
        classId: exam?.classId,
        className: classItem?.name ?? 'Unknown class',
        dateTaken: attempt.submittedAt ?? attempt.createdAt,
        status: attempt.status,
        score: grade
          ? grade.percentage
          : null,
        scoreStatus: grade
          ? 'released'
          : 'pending'
      };
    }),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
