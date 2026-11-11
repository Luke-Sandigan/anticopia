# Class Details API (BE-04)

All routes below use `/api/classes` and require `Authorization: Bearer <token>` from the existing auth endpoints. Errors retain the existing shape `{ error: string, details?: string[] }`. Validation failures return 400, missing/invalid/expired authentication 401, disallowed role/ownership/enrollment 403, missing records 404, and duplicate enrollments or writes to archived classes 409.

| Method | Path | Purpose / input |
| --- | --- | --- |
| GET | `/` | Own/enrolled classes; `page`, `limit`, `search`, `includeArchived=true` |
| GET | `/:classId` | Details with summary and teacher |
| PATCH | `/:classId` | Owner edits any of `name`, `code`, `section`, `subject`, `term`, `schedule`, `description` |
| DELETE | `/:classId` | Owner archives; 204 |
| GET | `/:classId/roster` | Owner-only active roster; `page`, `limit`, `search` |
| POST | `/:classId/roster` | Owner adds existing student; `{ identifier: emailOrStudentId }`; 201 |
| DELETE | `/:classId/roster/:studentId` | Owner soft-removes enrollment; 204 |
| POST | `/join` | Student joins/reactivates; `{ joinCode: string }`; 201 |
| POST | `/:classId/join-code/regenerate` | Owner rotates code; `{ joinCode: string }` |
| GET | `/:classId/exams` | Exams; `page`, `limit`, `search`, optional `status=upcoming\|ongoing\|past` |
| GET | `/:classId/summary` | Summary only |

Pagination defaults to page 1 / limit 20, maximum limit 100. Search is case-insensitive literal substring matching: class name/code/section, roster name/student ID/email, and exam name. Unknown list query parameters and edit body properties are rejected. Status is derived from UTC timestamps: upcoming before start, ongoing at/after start and before end, past at/after end. Drafts retain this time status and are visible only to the owner.

## Frontend contracts

```ts
type Pagination = { page: number; limit: number; total: number; totalPages: number };
type Summary = {
  studentCount: number;
  examCount: number;
  averageGrade: number | null;
  openFlagCount: number;
};
type ClassDetails = {
  id: string; name: string; code: string; section: string; subject: string;
  term: string; schedule: string; description: string;
  status: 'active' | 'archived'; archivedAt: string | null;
  joinCode?: string | null; // owner only; legacy classes may have none
  teacher: { id: string; firstName: string; lastName: string; email: string } | null;
  summary: Summary;
};
type RosterStudent = {
  id: string; // institutional studentId; kept compatible with existing roster
  userId?: string; email?: string; // optional on legacy enrollments
  name: string; enrollment: 'Enrolled' | 'Removed';
  account: 'Active' | 'Not verified'; performance: number;
};
type ClassExam = {
  id: string; classId: string; name: string; published: boolean;
  startsAt: string; endsAt: string;
  status: 'upcoming' | 'ongoing' | 'past';
};
type DetailsResponse = { class: ClassDetails };
type ClassesResponse = { classes: ClassDetails[]; pagination: Pagination };
type RosterResponse = { roster: RosterStudent[]; pagination: Pagination };
type AddedStudentResponse = { student: RosterStudent };
type JoinResponse = { classId: string; student: RosterStudent };
type ExamsResponse = { exams: ClassExam[]; pagination: Pagination };
type SummaryResponse = { summary: Summary };
type JoinCodeResponse = { joinCode: string };
type ApiError = { error: string; details?: string[] };
```

Teachers see aggregate grades and open flags across all class exams. Students see the number of active classmates, published exam count, their own released grades on published exams, and their own open flags on published exams. No roster, join code, other students' grades or flag evidence is returned to students. The average is an unweighted mean of stored percentages, or null with no qualifying grades. The existing enrollment `performance` value is retained for compatibility and is not used as a grade source.

## Schema and upgrade

The project uses Mongoose schemas plus index creation on startup, not versioned migration files. `database.js` follows this approach and backfills missing class status to active. Existing `classId` strings and roster `studentId` strings are unchanged.

- Classes add `teacherId` (User.id), `schedule`, `description`, `status`, `archivedAt`, and a unique optional `joinCode`. Codes contain 48 random bits as 12 hexadecimal characters; regeneration replaces the indexed value, so the old code stops matching.
- Enrollments add `userId` (User.id), `Removed` status, `removedAt`, and append-only joined/removed history. Existing unique class/student and class/email indexes remain; a partial unique class/user index is added. Reactivation updates the same row. Index violations return 409, including simultaneous duplicate joins.
- Users move from the temporary process-local Map to MongoDB with the same external `id`, password hashing and token format. Previously registered in-memory accounts cannot be recovered and must register again. Production requires `JWT_SECRET`.
- Minimal Exam, Grade and Flag schemas were absent and are added for reads/aggregates. Exams link to the existing string class ID; grades/flags link to `Exam.examId` and the institutional `User.studentId`. Grades store a 0–100 percentage and release state; flags store status and evidence. Future write routes must verify those links when creating records; MongoDB does not enforce foreign keys.
- Startup no longer inserts demo classes or fabricated students. Existing demo records are retained. Classes without a teacher remain inaccessible. Explicitly assign their `teacherId` to a real teacher's `User.id` before use, then call the regeneration endpoint to create a join code. Existing enrollments require explicit `userId` linkage to allow student access; never infer it from an unverified caller. Audit legacy duplicate class/student records before rollout: index creation intentionally fails on conflicting data rather than deleting history.

Archived classes disappear from default class lists and cannot be modified, joined or rotated. Owners and still-enrolled students can read their archived details and eligible exams using direct IDs or `includeArchived=true`. Exams, grades, flags and enrollments remain untouched. Removed students lose access immediately.

No class creation route existed; it remains outside BE-04. A later class-creation route must supply the authenticated teacher's ID. This change does not wire the preview frontend to these endpoints; clients must send the bearer token and consume the paginated envelopes.

## Tests

From `backend`, run `npm ci` then `npm test` (Node 20.19+). Tests use Node's test runner, HTTP requests and an isolated real MongoDB via `mongodb-memory-server`; no application database is touched. The first run needs network access to download MongoDB and permission to launch its process. An installed binary can be selected with `MONGOMS_SYSTEM_BINARY`.

The tests cover authentication/expiry, ownership and enrollment access, missing records, validation, edits, pagination/search, duplicate and concurrent enrollment, removal/reactivation history, join-code rotation, publication and timing filters, student summary privacy, archiving with evidence preservation, and persisted auth compatibility.
