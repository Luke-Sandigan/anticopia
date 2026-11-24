
import { randomUUID } from 'node:crypto';

import { Exam } from '../models/exam.model.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Submission } from '../models/submission.model.js';
import { Flag } from '../models/flag.model.js';

import { fail } from './class.service.js';

// ==========================================
// SHARED HELPERS
// ==========================================

function studentOnly(user) {
  if (user?.role !== 'student') {
    fail(403, 'Student access required');
  }
}

function deadlineFor(attempt, exam) {
  const started = new Date(attempt.createdAt).getTime();
  const minutes = Number(exam.duration ?? 90);

  const durationDeadline = started + minutes * 60 * 1000;

  const windowDeadline = exam.endsAt
    ? new Date(exam.endsAt).getTime()
    : durationDeadline;

  return new Date(
    Math.min(durationDeadline, windowDeadline)
  );
}

function timeRemaining(attempt, exam) {
  if (attempt.status !== 'in_progress') {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (deadlineFor(attempt, exam).getTime() - Date.now()) / 1000
    )
  );
}

function safeQuestions(exam) {
  return (exam.questions ?? []).map(question => ({
    id: question.id,
    type: question.type,
    question: question.question,
    points: question.points,
    ...(question.choices
      ? { choices: question.choices }
      : {})
  }));
}

function safeAnswers(attempt) {
  return attempt.answers.map(answer => ({
    questionId: answer.questionId,
    response: answer.response ?? answer.answer ?? null
  }));
}

function attemptResponse(attempt, exam) {
  return {
    attemptId: attempt.submissionId,
    examId: exam.examId,
    title: exam.name,
    instructions: exam.instructions ?? '',
    duration: exam.duration,
    startedAt: attempt.createdAt,
    expiresAt: deadlineFor(attempt, exam),
    timeRemainingSeconds: timeRemaining(attempt, exam),
    status: attempt.status,
    submittedAt: attempt.submittedAt ?? null,
    questions: safeQuestions(exam),
    answers: safeAnswers(attempt)
  };
}

async function ownedAttempt(attemptId, user) {
  studentOnly(user);

  const attempt = await Submission.findOne({
    submissionId: attemptId,
    studentId: user.studentId
  });

  if (!attempt) {
    fail(404, 'Attempt not found');
  }

  const exam = await Exam.findOne({
    examId: attempt.examId
  }).lean();

  if (!exam) {
    fail(404, 'Exam not found');
  }

  return { attempt, exam };
}

// ==========================================
// AUTOMATIC EXPIRATION
// ==========================================

async function finalizeExpired(attempt, exam) {
  if (
    attempt.status === 'in_progress' &&
    timeRemaining(attempt, exam) === 0
  ) {
    attempt.status = 'submitted';

    try {
      await attempt.save();
    } catch (error) {
      if (error.name !== 'VersionError') {
        throw error;
      }

      // Another request changed this attempt.
      // Reload the latest database state.
      const latest = await Submission.findOne({
        submissionId: attempt.submissionId,
        studentId: attempt.studentId
      });

      if (!latest) {
        fail(404, 'Attempt not found');
      }

      // If it is still active, the expiration worker
      // can retry on its next scan.
      return latest;
    }
  }

  return attempt;
}

// ==========================================
// MULTI-DEVICE DETECTION
// ==========================================

export async function recordMultiDevice(
  attemptId,
  user,
  sessionId
) {
  const { attempt, exam } = await ownedAttempt(
    attemptId,
    user
  );

  if (!exam.detectMultiDevice) {
    return { recorded: false };
  }

  if (
    typeof sessionId !== 'string' ||
    sessionId.length > 128 ||
    !sessionId.trim()
  ) {
    fail(400, 'Invalid session identifier');
  }

  if (sessionId === attempt.sessionId) {
    return { recorded: false };
  }

  const filter = {
    examId: exam.examId,
    studentId: user.studentId,
    type: 'multi_device',
    'evidence.sessionId': sessionId
  };

  const existing = await Flag.findOne(filter).lean();

  if (!existing) {
    await Flag.create({
      examId: exam.examId,
      studentId: user.studentId,
      type: 'multi_device',
      evidence: {
        attemptId,
        sessionId,
        detectedAt: new Date()
      }
    });
  }

  return { recorded: true };
}

// ==========================================
// START AN ATTEMPT
// POST /api/exams/:examId/attempts
// ==========================================

export async function startAttempt(examId, user) {
  studentOnly(user);

  const exam = await Exam.findOne({
    examId,
    published: true,
    archivedAt: null
  }).lean();

  if (!exam) {
    fail(404, 'Exam not found');
  }

  const enrolled = await Enrollment.exists({
    classId: exam.classId,
    userId: user.id,
    enrollment: 'Enrolled'
  });

  if (!enrolled) {
    fail(403, 'Student is not enrolled');
  }

  const activeClass = await Class.exists({
    classId: exam.classId,
    status: 'active'
  });

  if (!activeClass) {
    fail(403, 'Class is not active');
  }

  const now = new Date();

  if (
    !exam.startsAt ||
    !exam.endsAt ||
    now < new Date(exam.startsAt) ||
    now >= new Date(exam.endsAt)
  ) {
    fail(403, 'Exam is outside its scheduled window');
  }

  const existing = await Submission.exists({
    examId,
    studentId: user.studentId
  });

  if (existing) {
    fail(409, 'Student already has an attempt');
  }

  const sessionId = randomUUID();

  // The unique database index prevents two attempts
  // from being created for the same student and exam.
  const attempt = await Submission.create({
    examId,
    studentId: user.studentId,
    status: 'in_progress',
    sessionId,
    answers: []
  });

  return {
    attemptId: attempt.submissionId,
    examId,
    sessionId,
    status: attempt.status,
    startedAt: attempt.createdAt,
    expiresAt: deadlineFor(attempt, exam),
    timeRemainingSeconds: timeRemaining(attempt, exam)
  };
}

// ==========================================
// GET AN ATTEMPT
// GET /api/attempts/:attemptId
// ==========================================

export async function getAttempt(
  attemptId,
  user,
  sessionId
) {
  const { attempt, exam } = await ownedAttempt(
    attemptId,
    user
  );

  const latest = await finalizeExpired(
    attempt,
    exam
  );

  if (
    latest.status === 'in_progress' &&
    exam.detectMultiDevice &&
    sessionId !== latest.sessionId
  ) {
    await recordMultiDevice(
      attemptId,
      user,
      sessionId || 'unknown-session'
    );
  }

  return attemptResponse(latest, exam);
}

// ==========================================
// AUTOSAVE AN ANSWER
// PUT /api/attempts/:attemptId/answers/:questionId
// ==========================================

export async function saveAnswer(
  attemptId,
  questionId,
  user,
  body
) {
  studentOnly(user);

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !Object.hasOwn(body, 'response') ||
    Object.keys(body).some(key => key !== 'response')
  ) {
    fail(400, 'Provide a response field');
  }

  const value = body.response;

  if (
    value !== null &&
    typeof value !== 'string' &&
    typeof value !== 'boolean'
  ) {
    fail(400, 'Invalid answer response');
  }

  // Optimistic concurrency:
  // Retry if another request changed the submission.
  for (let retry = 0; retry < 5; retry++) {
    const { attempt, exam } = await ownedAttempt(
      attemptId,
      user
    );

    const latest = await finalizeExpired(
      attempt,
      exam
    );

    if (latest.status !== 'in_progress') {
      fail(409, 'Attempt has already been submitted');
    }

    if (timeRemaining(latest, exam) === 0) {
      fail(409, 'Attempt time has expired');
    }

    const question = (exam.questions ?? []).find(
      item => item.id === questionId
    );

    if (!question) {
      fail(404, 'Question not found');
    }

    const saved = latest.answers.find(
      item => item.questionId === questionId
    );

    if (saved) {
      saved.response = value;
    } else {
      latest.answers.push({
        questionId,
        response: value,
        score: 0
      });
    }

    try {
      await latest.save();

      return {
        attemptId,
        questionId,
        response: value,
        saved: true
      };
    } catch (error) {
      if (error.name === 'VersionError') {
        continue;
      }

      throw error;
    }
  }

  fail(409, 'Answer changed concurrently; retry');
}

// ==========================================
// SUBMIT AN ATTEMPT
// POST /api/attempts/:attemptId/submit
// ==========================================

export async function submitAttempt(attemptId, user) {
  studentOnly(user);

  // If two submissions arrive together, only the
  // first should update the database.
  for (let retry = 0; retry < 5; retry++) {
    const { attempt } = await ownedAttempt(
      attemptId,
      user
    );

    if (attempt.status === 'in_progress') {
      attempt.status = 'submitted';

      try {
        // Submission model hooks automatically:
        // - Set the submission timestamp
        // - Grade objective questions
        // - Update the grade record
        await attempt.save();
      } catch (error) {
        if (error.name === 'VersionError') {
          // Reload and check whether the other
          // request already submitted the attempt.
          continue;
        }

        throw error;
      }
    }

    return {
      attemptId: attempt.submissionId,
      examId: attempt.examId,
      status: attempt.status,
      submittedAt: attempt.submittedAt ?? null,
      timeRemainingSeconds: 0
    };
  }

  fail(409, 'Submission changed concurrently; retry');
}
