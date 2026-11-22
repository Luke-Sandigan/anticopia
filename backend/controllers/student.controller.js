import { Enrollment } from '../models/enrollment.model.js';
import { Class } from '../models/class.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';

export async function getDashboard(req, res) {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      error: 'Student access only'
    });
  }

  const student = req.user;
  const now = new Date();

  // 1. Find the student's active enrollments.
  const identities = [{ userId: student.id }];

  if (student.studentId) {
    identities.push({ studentId: student.studentId });
  }

  const enrollments = await Enrollment.find({
    enrollment: 'Enrolled',
    $or: identities
  }).lean();

  const classIds = [...new Set(
    enrollments.map(e => e.classId)
  )];

  // 2. Find active classes.
  const classes = await Class.find({
    classId: { $in: classIds },
    status: 'active'
  }).lean();

  const activeClassIds = classes.map(c => c.classId);

  // 3. Only published exams from active enrolled classes.
  const exams = await Exam.find({
  classId: { $in: activeClassIds },
  published: true,
  archivedAt: null
})
  .select('examId classId name description duration startsAt endsAt resultsReleased')
  .lean();

  const upcomingExams = exams
    .filter(e => e.startsAt && new Date(e.startsAt) > now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const ongoingExams = exams.filter(e =>
    e.startsAt &&
    new Date(e.startsAt) <= now &&
    (!e.endsAt || new Date(e.endsAt) > now)
  );

  // 4. Only released grades belonging to this student.
  const visibleExamIds = exams.map(e => e.examId);

  const grades = await Grade.find({
    studentId: student.studentId,
    examId: { $in: visibleExamIds },
    released: true
  }).sort({ updatedAt: -1 }).lean();

  const examNames = new Map(
    exams.map(e => [e.examId, e.name])
  );

  const recentGrades = grades.slice(0, 5).map(g => ({
    examId: g.examId,
    examName: examNames.get(g.examId),
    percentage: g.percentage
  }));

  const publicExam = (exam) => ({
  examId: exam.examId,
  classId: exam.classId,
  name: exam.name,
  description: exam.description,
  duration: exam.duration,
  startsAt: exam.startsAt,
  endsAt: exam.endsAt
});

  return res.json({
  classCount: classes.length,
  upcomingExams: upcomingExams.map(publicExam),
  ongoingExams: ongoingExams.map(publicExam),
  recentGrades
});
}
