
import { Submission } from '../models/submission.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { fail } from '../services/class.service.js';

// ==========================================
// BE-18: SUBMISSION CONFIRMATION
// GET /api/attempts/:attemptId/confirmation
// ==========================================

function isAnswered(answer) {
  const value = answer.response ?? answer.answer;

  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'boolean') {
    return true;
  }

  return false;
}

export async function getConfirmation(req, res) {
  const user = req.user;
  const { attemptId } = req.params;

  // Only authenticated students may use this route.
  if (user?.role !== 'student') {
    fail(403, 'Student access required');
  }

  // Find the submission by its public attempt ID.
  const attempt = await Submission.findOne({
    submissionId: attemptId
  }).lean();

  if (!attempt) {
    fail(404, 'Attempt not found');
  }

  // BE-18 explicitly requires HTTP 403 for
  // another student accessing the attempt.
  if (attempt.studentId !== user.studentId) {
    fail(403, 'You cannot access this submission');
  }

  // Confirmation is available only after submission.
  if (attempt.status === 'in_progress') {
    fail(409, 'Exam has not been submitted yet');
  }

  const exam = await Exam.findOne({
    examId: attempt.examId
  })
    .select(
      'examId name questions.id resultsReleased'
    )
    .lean();

  if (!exam) {
    fail(404, 'Exam not found');
  }

  const questionIds = new Set(
    (exam.questions ?? []).map(question => question.id)
  );

  // Count distinct questions with actual answers.
  // Empty answers are not counted.
  const answeredIds = new Set(
    (attempt.answers ?? [])
      .filter(answer =>
        questionIds.has(answer.questionId) &&
        isAnswered(answer)
      )
      .map(answer => answer.questionId)
  );

  const questionsAnswered = answeredIds.size;
  const totalQuestions = questionIds.size;

  // submissionId is generated once when the attempt
  // starts, making it a stable reference number.
  const confirmation = {
    attemptId: attempt.submissionId,
    examId: attempt.examId,
    examTitle: exam.name,
    referenceNumber: attempt.submissionId,
    submittedAt: attempt.submittedAt,
    questionsAnswered,
    totalQuestions,
    status: attempt.status
  };

  // Only expose the grade when both the exam and
  // the individual grade have been released.
  if (exam.resultsReleased === true) {
    const grade = await Grade.findOne({
      examId: attempt.examId,
      studentId: user.studentId,
      released: true
    })
      .select('percentage')
      .lean();

    if (grade) {
      confirmation.percentage = grade.percentage;
    }
  }

  return res.json({
    confirmation
  });
}
