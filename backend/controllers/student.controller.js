
import { Enrollment } from '../models/enrollment.model.js';
import { Class } from '../models/class.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { Submission } from '../models/submission.model.js';
import * as classService from '../services/class.service.js';

// ==========================================
// SHARED HELPERS
// ==========================================

function studentOnly(user) {
  if (user.role !== 'student') {
    classService.fail(403, 'Student access required');
  }
}

function publicExam(exam) {
  return {
    examId: exam.examId,
    classId: exam.classId,
    name: exam.name,
    description: exam.description,
    duration: exam.duration,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt
  };
}

function publicClass(item) {
  return {
    classId: item.classId,
    name: item.name,
    section: item.section,
    subject: item.subject,
    term: item.term,
    code: item.code,
    schedule: item.schedule ?? '',
    description: item.description ?? ''
  };
}

// ==========================================
// BE-14: STUDENT DASHBOARD
// GET /api/student/dashboard
// ==========================================

export async function getDashboard(req, res) {
  studentOnly(req.user);

  const student = req.user;
  const now = new Date();

  const classIds = await Enrollment.distinct('classId', {
    userId: student.id,
    enrollment: 'Enrolled'
  });

  const classes = await Class.find({
    classId: { $in: classIds },
    status: 'active'
  }).lean();

  const activeClassIds = classes.map(item => item.classId);

  const exams = await Exam.find({
    classId: { $in: activeClassIds },
    published: true,
    archivedAt: null
  })
    .select(
      'examId classId name description duration startsAt endsAt resultsReleased'
    )
    .lean();

  const upcomingExams = exams
    .filter(exam =>
      exam.startsAt &&
      new Date(exam.startsAt) > now
    )
    .sort((a, b) =>
      new Date(a.startsAt) - new Date(b.startsAt)
    );

  const ongoingExams = exams.filter(exam =>
    exam.startsAt &&
    new Date(exam.startsAt) <= now &&
    (!exam.endsAt || new Date(exam.endsAt) > now)
  );

  const releasedExamIds = exams
    .filter(exam => exam.resultsReleased === true)
    .map(exam => exam.examId);

  const grades = await Grade.find({
    studentId: student.studentId,
    examId: { $in: releasedExamIds },
    released: true
  })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  const examNames = new Map(
    exams.map(exam => [exam.examId, exam.name])
  );

  const recentGrades = grades.map(grade => ({
    examId: grade.examId,
    examName: examNames.get(grade.examId),
    percentage: grade.percentage
  }));

  return res.json({
    classCount: classes.length,
    upcomingExams: upcomingExams.map(publicExam),
    ongoingExams: ongoingExams.map(publicExam),
    recentGrades
  });
}

// ==========================================
// BE-15: STUDENT MY CLASSES
// GET /api/student/classes
// ==========================================

export async function getStudentClasses(req, res) {
  studentOnly(req.user);

  const classIds = await Enrollment.distinct('classId', {
    userId: req.user.id,
    enrollment: 'Enrolled'
  });

  const classes = await Class.find({
    classId: { $in: classIds },
    status: { $ne: 'archived' }
  })
    .sort({ name: 1, classId: 1 })
    .lean();

  return res.json({
    classes: classes.map(publicClass)
  });
}

// ==========================================
// BE-15: STUDENT CLASS DETAILS
// GET /api/student/classes/:classId
// ==========================================

export async function getStudentClassDetails(req, res) {
  studentOnly(req.user);

  const { classId } = req.params;

  const enrollment = await Enrollment.exists({
    classId,
    userId: req.user.id,
    enrollment: 'Enrolled'
  });

  if (!enrollment) {
    classService.fail(404, 'Class not found');
  }

  const item = await Class.findOne({
    classId,
    status: { $ne: 'archived' }
  }).lean();

  if (!item) {
    classService.fail(404, 'Class not found');
  }

  const exams = await Exam.find({
    classId,
    published: true,
    archivedAt: null
  })
    .select(
      'examId classId name description duration startsAt endsAt'
    )
    .sort({ startsAt: 1, examId: 1 })
    .lean();

  return res.json({
    class: publicClass(item),
    exams: exams.map(publicExam)
  });
}

// ==========================================
// BE-15: LEAVE STUDENT CLASS
// POST /api/student/classes/:classId/leave
// ==========================================

export async function leaveStudentClass(req, res) {
  studentOnly(req.user);

  const now = new Date();

  const enrollment = await Enrollment.findOneAndUpdate(
    {
      classId: req.params.classId,
      userId: req.user.id,
      enrollment: 'Enrolled'
    },
    {
      $set: {
        enrollment: 'Removed',
        removedAt: now
      },
      $push: {
        history: {
          action: 'removed',
          at: now
        }
      }
    },
    { new: true }
  );

  if (!enrollment) {
    classService.fail(404, 'Active enrollment not found');
  }

  // Preserve enrollment history and previous grades.
  return res.status(204).end();
}

// ==========================================
// BE-16: EXAM DETAILS AND INSTRUCTIONS
// GET /api/student/exams/:examId
// ==========================================

export async function getStudentExamDetails(req, res) {
  studentOnly(req.user);

  const { examId } = req.params;
  const student = req.user;
  const now = new Date();

  // Find the requested published and non-archived exam.
  // Project only the fields required for student details.
  const exam = await Exam.findOne({
    examId,
    published: true,
    archivedAt: null
  })
    .select(
      'examId classId name instructions duration ' +
      'startsAt endsAt detectTabSwitches ' +
      'detectMultiDevice captureScreenshots questions.id'
    )
    .lean();

  if (!exam) {
    classService.fail(404, 'Exam not found');
  }

  // Only actively enrolled students can view details.
  const enrolled = await Enrollment.exists({
    classId: exam.classId,
    userId: student.id,
    enrollment: 'Enrolled'
  });

  if (!enrolled) {
    classService.fail(403, 'You are not enrolled in this class');
  }

  const activeClass = await Class.exists({
    classId: exam.classId,
    status: 'active'
  });

  if (!activeClass) {
    classService.fail(404, 'Class is not available');
  }

  // Find this student's existing attempt.
  const attempt = await Submission.findOne({
    examId: exam.examId,
    studentId: student.studentId
  })
    .select('submissionId status')
    .lean();

  // Calculate the availability window on the server.
  const startsAt = exam.startsAt
    ? new Date(exam.startsAt)
    : null;

  const endsAt = exam.endsAt
    ? new Date(exam.endsAt)
    : null;

  const withinWindow = Boolean(
    startsAt &&
    endsAt &&
    startsAt <= now &&
    now < endsAt
  );

  // A new attempt is allowed only during the
  // exam window and when no attempt exists.
  const canStart = withinWindow && !attempt;

  return res.json({
    exam: {
      examId: exam.examId,
      classId: exam.classId,

      title: exam.name,
      instructions: exam.instructions ?? '',
      duration: exam.duration,

      startsAt: exam.startsAt,
      endsAt: exam.endsAt,

      questionCount: exam.questions?.length ?? 0,

      monitoringRules: {
        tabSwitching: exam.detectTabSwitches ?? true,
        multiDevice: exam.detectMultiDevice ?? true,
        screenshots: exam.captureScreenshots ?? false
      },

      attemptStatus: attempt?.status ?? null,
      canStart
    }
  });
}
