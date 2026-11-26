import { Exam } from '../models/exam.model.js';
import { Flag } from '../models/flag.model.js';
import { Grade } from '../models/grade.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';
import { accessibleClass, teacherOnly } from './class.service.js';
import { accessExam } from './exam.service.js';

const scoreBuckets = [
  { label: '0-59', min: 0, max: 59 },
  { label: '60-69', min: 60, max: 69 },
  { label: '70-79', min: 70, max: 79 },
  { label: '80-89', min: 80, max: 89 },
  { label: '90-100', min: 90, max: 100 },
];

function round(value) {
  return Number(value.toFixed(2));
}

function gradeKey(examId, studentId) {
  return `${examId}:${studentId}`;
}

function totalPoints(exam) {
  return (exam.questions ?? []).reduce((total, question) => total + question.points, 0);
}

function publicExam(exam) {
  return {
    id: exam.examId,
    title: exam.name,
    totalPoints: totalPoints(exam),
    passingScore: exam.passingScore,
  };
}

function submissionPercentage(submission, exam, grades) {
  const grade = grades.get(gradeKey(submission.examId, submission.studentId));
  if (typeof grade?.percentage === 'number') return grade.percentage;
  const points = submission.totalPoints || totalPoints(exam);
  return points ? round((submission.totalScore / points) * 100) : 0;
}

function scoreSummary(scores, passingScores) {
  if (!scores.length) {
    return { gradedSubmissions: 0, average: 0, highest: 0, lowest: 0, passRate: 0 };
  }
  const thresholds = Array.isArray(passingScores) ? passingScores : scores.map(() => passingScores);
  return {
    gradedSubmissions: scores.length,
    average: round(scores.reduce((total, score) => total + score, 0) / scores.length),
    highest: round(Math.max(...scores)),
    lowest: round(Math.min(...scores)),
    passRate: round((scores.filter((score, index) => score >= thresholds[index]).length / scores.length) * 100),
  };
}

function scoreDistribution(scores) {
  const distribution = scoreBuckets.map((bucket) => ({ ...bucket, count: 0 }));
  for (const score of scores) {
    const bucketIndex = score < 60 ? 0 : Math.min(4, Math.floor((score - 60) / 10) + 1);
    distribution[bucketIndex].count += 1;
  }
  return distribution;
}

function questionAnalytics(exam, submissions) {
  return (exam.questions ?? []).map((question) => {
    const correctCount = submissions.reduce((total, submission) => {
      const answer = (submission.answers ?? []).find((item) => item.questionId === question.id);
      return total + (typeof answer?.score === 'number' && answer.score >= question.points ? 1 : 0);
    }, 0);
    return {
      id: question.id,
      question: question.question,
      type: question.type,
      points: question.points,
      gradedSubmissions: submissions.length,
      correctCount,
      correctRate: submissions.length ? round((correctCount / submissions.length) * 100) : 0,
    };
  });
}

export function flagType(flag) {
  const evidence = flag.evidence && typeof flag.evidence === 'object' ? flag.evidence : {};
  for (const value of [flag.type, evidence.type, evidence.eventType, evidence.event]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'unknown';
}

function tally(items, property) {
  const counts = new Map();
  for (const item of items) {
    const value = item[property];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, count]) => ({ [property]: value, count }));
}

async function analyticsData(exams) {
  const examIds = exams.map((exam) => exam.examId);
  if (!examIds.length) return { submissions: [], grades: new Map() };
  const [submissions, grades] = await Promise.all([
    Submission.find({ examId: { $in: examIds }, status: 'graded' }).lean(),
    Grade.find({ examId: { $in: examIds } }).lean(),
  ]);
  return {
    submissions,
    grades: new Map(grades.map((grade) => [gradeKey(grade.examId, grade.studentId), grade])),
  };
}

function examSummary(exam, submissions, grades) {
  const scores = submissions.map((submission) => submissionPercentage(submission, exam, grades));
  return {
    ...publicExam(exam),
    summary: scoreSummary(scores, exam.passingScore),
  };
}

export async function getExamScoreSummary(exam) {
  const { submissions, grades } = await analyticsData([exam]);
  return examSummary(exam, submissions, grades).summary;
}

export async function getExamAnalytics(examId, user) {
  teacherOnly(user);
  const { item: exam } = await accessExam(examId, user, false, true);
  const { submissions, grades } = await analyticsData([exam]);
  const scores = submissions.map((submission) => submissionPercentage(submission, exam, grades));
  return {
    exam: publicExam(exam),
    summary: scoreSummary(scores, exam.passingScore),
    scoreDistribution: scoreDistribution(scores),
    questions: questionAnalytics(exam, submissions),
  };
}

export async function getClassAnalytics(classId, user) {
  teacherOnly(user);
  const classItem = await accessibleClass(classId, user);
  const exams = await Exam.find({ classId }).sort({ startsAt: 1, name: 1, examId: 1 }).lean();
  const { submissions, grades } = await analyticsData(exams);
  const scoredSubmissions = submissions.map((submission) => {
    const exam = exams.find((item) => item.examId === submission.examId);
    return { score: submissionPercentage(submission, exam, grades), passingScore: exam.passingScore };
  });
  const scores = scoredSubmissions.map((item) => item.score);
  return {
    class: {
      id: classItem.classId,
      name: classItem.name,
      section: classItem.section,
      subject: classItem.subject,
      term: classItem.term,
    },
    summary: {
      exams: exams.length,
      ...scoreSummary(scores, scoredSubmissions.map((item) => item.passingScore)),
    },
    trends: exams.map((exam) => examSummary(
      exam,
      submissions.filter((submission) => submission.examId === exam.examId),
      grades,
    )),
  };
}

export async function getIntegrityReport(examId, user) {
  teacherOnly(user);
  const { item: exam } = await accessExam(examId, user, false, true);
  const studentIds = await Submission.distinct('studentId', { examId, status: 'graded' });
  if (!studentIds.length) {
    return {
      exam: publicExam(exam),
      summary: { gradedStudents: 0, totalFlags: 0, studentsFlagged: 0, byType: [], byReviewStatus: [] },
      students: [],
    };
  }
  const [flags, students] = await Promise.all([
    Flag.find({ examId, studentId: { $in: studentIds } }).sort({ createdAt: -1, _id: 1 }).lean(),
    User.find({ role: 'student', studentId: { $in: studentIds } }).lean(),
  ]);
  const studentById = new Map(students.map((student) => [student.studentId, student]));
  const flagsByStudent = new Map();
  for (const flag of flags) {
    const typedFlag = { ...flag, type: flagType(flag) };
    const items = flagsByStudent.get(flag.studentId) ?? [];
    items.push(typedFlag);
    flagsByStudent.set(flag.studentId, items);
  }
  const flaggedStudents = [...flagsByStudent.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([studentId, studentFlags]) => {
      const student = studentById.get(studentId);
      return {
        student: student ? {
          id: student.studentId,
          name: `${student.firstName} ${student.lastName}`.trim(),
          email: student.email,
        } : { id: studentId, name: studentId, email: null },
        totalFlags: studentFlags.length,
        byType: tally(studentFlags, 'type'),
        byReviewStatus: tally(studentFlags, 'status').map((item) => ({ reviewStatus: item.status, count: item.count })),
        flags: studentFlags.map((flag) => ({
          id: String(flag._id),
          type: flag.type,
          reviewStatus: flag.status,
          evidence: flag.evidence ?? null,
          createdAt: flag.createdAt,
          updatedAt: flag.updatedAt,
        })),
      };
    });
  return {
    exam: publicExam(exam),
    summary: {
      gradedStudents: studentIds.length,
      totalFlags: flags.length,
      studentsFlagged: flaggedStudents.length,
      byType: tally(flags.map((flag) => ({ ...flag, type: flagType(flag) })), 'type'),
      byReviewStatus: tally(flags, 'status').map((item) => ({ reviewStatus: item.status, count: item.count })),
    },
    students: flaggedStudents,
  };
}
