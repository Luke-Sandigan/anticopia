# Teacher Classes API (BE-09)

These authenticated routes support teacher class creation, editing, and archiving. Class detail retrieval (`GET /:classId`) and student class joining are separate operations and are unchanged by this ticket.

All paths are under `/api/classes` and require `Authorization: Bearer <teacher-token>`. Get a token from `POST /api/auth/login` with `{ "email": "...", "password": "...", "role": "teacher" }`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/` | Create a class owned by the signed-in teacher; returns 201 and `{ "class": ... }` |
| PATCH | `/:classId` | Edit allowed class fields; returns the updated class |
| DELETE | `/:classId` | Soft archive the class; returns 204 |

## Create a class

```http
POST /api/classes
Content-Type: application/json
Authorization: Bearer <teacher-token>
```

```json
{
  "name": "Data Structures",
  "section": "Section A",
  "subject": "Computer Science",
  "term": "Term 1, 2026",
  "schedule": "Monday 10:00",
  "description": "Fundamentals of data structures"
}
```

`name`, `section`, `subject`, and `term` are required. `schedule` and `description` are optional. The server generates the class ID and class code, assigns ownership to the authenticated teacher, and starts the class in `active` status. Request fields for ownership, status, IDs, and codes are rejected.

## Edit and archive

`PATCH /api/classes/:classId` accepts one or more of `name`, `code`, `section`, `subject`, `term`, `schedule`, and `description`. It rejects unknown fields and empty updates. Only the owning teacher can edit the class; archived classes cannot be edited.

`DELETE /api/classes/:classId` archives the class by setting its status and archive timestamp. It preserves class, roster, exam, and grade records. Repeating the archive request returns a conflict response.

## Postman

Import `postman/Teacher Classes.postman_collection.json`. Set `baseUrl`, `teacherEmail`, and `teacherPassword`. Run **Login Teacher**, then **Create Class**, **Edit Class**, and **Archive Class** in order. The create request saves the generated class ID for the later requests. The optional **Register Teacher** request can create a teacher account if needed; after registration, set the same credentials for the login request.
