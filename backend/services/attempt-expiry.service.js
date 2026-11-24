
import { Exam } from '../models/exam.model.js';
import { Submission } from '../models/submission.model.js';

let running = false;
let timer = null;

// ==========================================
// CALCULATE ATTEMPT DEADLINE
// ==========================================

function getDeadline(attempt, exam) {
  const startedAt = new Date(attempt.createdAt).getTime();

  const durationMs =
    Number(exam.duration ?? 90) * 60 * 1000;

  const durationDeadline = startedAt + durationMs;

  const examDeadline = exam.endsAt
    ? new Date(exam.endsAt).getTime()
    : Infinity;

  return Math.min(durationDeadline, examDeadline);
}

// ==========================================
// SAFELY SUBMIT AN EXPIRED ATTEMPT
// ==========================================

async function finalizeExpiredAttempt(attemptId) {
  for (let retry = 0; retry < 5; retry++) {
    // Reload each time to avoid stale data.
    const attempt = await Submission.findOne({
      submissionId: attemptId
    });

    if (!attempt || attempt.status !== 'in_progress') {
      return;
    }

    const exam = await Exam.findOne({
      examId: attempt.examId
    })
      .select('duration endsAt')
      .lean();

    if (!exam) return;

    const now = Date.now();
    const deadline = getDeadline(attempt, exam);

    if (now < deadline) return;

    attempt.status = 'submitted';

    try {
      // Existing Submission hooks handle:
      // - Final submission status
      // - MCQ and True/False grading
      // - Submitted timestamp
      // - Grade synchronization
      await attempt.save();

      return;
    } catch (error) {
      if (error.name === 'VersionError') {
        // An autosave or another submission changed
        // this attempt. Reload and retry.
        continue;
      }

      throw error;
    }
  }

  // Retry on the next scheduled scan.
}

// ==========================================
// SCAN EXPIRED ATTEMPTS
// ==========================================

export async function expireAttempts() {
  if (running) return;

  running = true;

  try {
    const attempts = await Submission.find({
      status: 'in_progress'
    })
      .select('submissionId')
      .lean();

    for (const attempt of attempts) {
      try {
        await finalizeExpiredAttempt(
          attempt.submissionId
        );
      } catch (error) {
        console.error(
          `Failed to expire attempt ${attempt.submissionId}:`,
          error
        );
      }
    }
  } finally {
    running = false;
  }
}

// ==========================================
// START AUTOMATIC EXPIRATION WORKER
// ==========================================

export function startAttemptExpiryWorker() {
  if (timer) return;

  timer = setInterval(() => {
    expireAttempts().catch(error => {
      console.error(
        'Attempt expiry worker failed:',
        error
      );
    });
  }, 10000);

  timer.unref();

  // Scan when the server starts.
  expireAttempts().catch(error => {
    console.error(
      'Initial expiry scan failed:',
      error
    );
  });
}

// ==========================================
// STOP WORKER
// ==========================================

export function stopAttemptExpiryWorker() {
  if (!timer) return;

  clearInterval(timer);
  timer = null;
}
