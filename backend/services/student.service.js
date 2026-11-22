
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
