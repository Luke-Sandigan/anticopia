# BE-06: Question bank and exam builder

Every endpoint requires `Authorization: Bearer <teacherToken>`. Students receive 403 from every bank/builder endpoint. Existing student exam responses omit all question content, including answer keys.

| Method | Route | Body / result |
| --- | --- | --- |
| POST | `/api/questions` | Question input → 201 `{ question }` |
| GET | `/api/questions?type=&search=&page=1&limit=20` | 200 `{ questions, pagination }`; only caller's undeleted questions |
| PATCH | `/api/questions/:id` | Partial question input → 200 `{ question }` |
| DELETE | `/api/questions/:id` | 204; soft deletion preserves exam snapshots |
| POST | `/api/exams/:examId/questions` | `{ "questionIds": ["id1", "id2"] }` → 200 `{ exam }` |
| DELETE | `/api/exams/:examId/questions/:questionId` | 200 `{ exam }` |
| PATCH | `/api/exams/:examId/questions/order` | `{ "questionIds": ["id2", "id1"] }` → 200 `{ exam }` |

Types are `multiple_choice`, `true_false`, `essay`. Existing UI labels `Multiple choice`, `True/false`, `Essay` are also accepted; bank responses normalize to the lowercase values. Exam snapshots retain the established BE-05/UI shape (`question`, `choices`, display-label `type`). New short-answer questions are rejected.

Question input: `text`, `type`, `points`, optional `topic`, `options`, `correctAnswer`. Multiple choice requires 2–20 distinct nonempty options and a matching answer. True/false accepts a boolean or `"True"`/`"False"` and stores the capitalized string. Essay may omit the answer or supply a private reference answer. Points must be numeric, 0.01–10000. PATCH validates the merged question, including options/answer consistency. Types other than multiple choice must have no options; pass `options: []` when converting a multiple-choice question. IDs, ownership and timestamps cannot be edited.

Lists support case-insensitive literal search on text/topic, type filtering, and the existing pagination defaults/maximum (20/100). Errors retain `{ error: string, details?: string[] }`: 400 invalid input/order, 401 missing auth, 403 wrong role/owner, 404 missing/deleted record, 409 duplicate attachment, concurrent edit or frozen exam.

Attach operations authorize the entire batch before writing and preserve the requested order. Reordering requires every attached ID exactly once. An exam allows at most 500 questions. Question-bank deletion or editing never changes attached snapshots; remove/re-add to refresh an editable exam. Published exams cannot lose their final question. Live, submitted or archived exams and archived parent classes retain BE-05's write restrictions.

Every `/api/exams` response includes `totalPoints`, computed from its stored snapshots rather than a separately stored counter. Student responses contain no questions or correct answers. Frontend contracts are in `frontend/src/types/questions.ts` and `frontend/src/types/exams.ts`.

## Check it with Postman / Thunder Client

Use an existing owned class and create a draft using BE-05 (`POST /api/classes/:classId/exams`, `{ "title": "Builder check", "duration": 30 }`). Save the returned `exam.id`.

1. POST each body below to `/api/questions`, saving each returned `question.id`:

   ```json
   { "text": "What is 2 + 2?", "type": "multiple_choice", "options": ["3", "4"], "correctAnswer": "4", "points": 2 }
   ```
   ```json
   { "text": "A stack is LIFO.", "type": "true_false", "correctAnswer": true, "points": 3 }
   ```
   ```json
   { "text": "Explain a balanced tree.", "type": "essay", "points": 5 }
   ```

2. GET `/api/questions`: all three appear. GET `/api/questions?type=essay`: only essays appear.
3. POST `/api/exams/:examId/questions` with all three IDs. Expect `questionCount: 3`, `totalPoints: 10`.
4. PATCH `/api/exams/:examId/questions/order` with the same IDs in a different order. GET `/api/exams/:examId` and verify `exam.questions` retains that order and total 10.
5. PATCH `/api/questions/:id` with `{ "points": 7 }` using another teacher's token: expect 403. With the owning token: expect 200, while the already-attached snapshot and exam total remain unchanged.
6. Set a future window on the exam with BE-05 PATCH (`availableFrom`, `availableUntil`, ISO timestamps including timezone, at least 30 minutes apart), then POST `/api/exams/:examId/publish`.
7. GET `/api/exams/:examId` using an enrolled student's token: expect 200, `totalPoints: 10`, and no `questions` or `correctAnswer`. GET `/api/questions` with that token: expect 403.
8. DELETE one attached question: remaining total reflects its removal. DELETE a bank question: it disappears from the bank but stays in attached snapshots.

## Schema and tests

Adds a `questions` collection with unique question ID, teacher link, content, soft-deletion timestamp and revision; ownership/type/list indexes are created during the existing database startup. No class/exam IDs or existing snapshots are rewritten. Historical Short answer snapshots remain readable, but new questions are limited to the requested three types. No new dependencies.

From `backend`: `npm test`. HTTP integration tests cover all steps above, bank/search pagination, all seven auth checks, cross-owner batches, duplicate/missing IDs, bad order, immutable snapshots, validation and exam edit locks. They run against isolated MongoDB, not the application database.
