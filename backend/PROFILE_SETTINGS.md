# Profile and settings API (BE-13)

These routes support teachers and students. Use `Authorization: Bearer <token>`
from registration or login. Identity always comes from the token; no user ID is
accepted in the body. Missing, invalid, expired or deleted-account tokens return 401.

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| GET | `/api/auth/me` | None | 200 `{ user: Profile }` |
| PATCH | `/api/auth/me` | Partial profile JSON (below) | 200 `{ user: Profile }` |
| POST | `/api/auth/me/password` | `{ currentPassword, newPassword }` | 200 `{ message: "Password changed successfully" }` |
| POST | `/api/auth/me/photo` | Multipart form with exactly one `photo` file | 200 `{ user: Profile }` |

```ts
type Preferences = {
  notifications: { examUpdatesEmail: boolean; flaggedEventAlerts: boolean };
  monitoring: { soundOnAlert: boolean; groupRepeatedEvents: boolean };
};
type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo: string | null; // e.g. uploads/<random-uuid>.png, relative to API origin
  contactInfo: { phone: string };
  preferences: Preferences;
  createdAt: string; // ISO date
} & (
  | { role: 'teacher'; employeeId: string; department: string }
  | { role: 'student'; studentId: string }
);
type ProfilePatch = {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactInfo?: { phone?: string };
  preferences?: {
    notifications?: Partial<Preferences['notifications']>;
    monitoring?: Partial<Preferences['monitoring']>;
  };
};
type ApiError = { error: string; details?: string[] };
```

PATCH requires at least one top-level field. Nested patches preserve omitted
siblings. Names are trimmed and contain 1–100 characters. Email is normalized
to lowercase and must be valid and at most 254 characters. Phone is optional,
at most 50 characters, and can be cleared with an empty string. Preferences
must be booleans. Unknown fields at every level are rejected with 400, including
IDs, role, department, employee/student identifiers, timestamps, password hashes,
and photo paths. Photos are updated only through the upload endpoint.

Duplicate emails return 409 with `An account with this email already exists`.
Wrong current passwords return 401. New passwords must be 8–128 characters,
matching registration, and differ from the current password (400 otherwise).
Password changes use the existing scrypt helper and compare the existing hash
when saving to prevent concurrent changes from overwriting one another.
Existing JWTs retain their normal one-hour lifetime after password/email changes;
authentication loads the current account from MongoDB on every request.

## Photos

In Postman choose Body → form-data, add key `photo`, select **File**, and choose
a JPEG or PNG no larger than 2 MiB (2,097,152 bytes). Do not manually set the
multipart Content-Type header; Postman adds its boundary.

The server validates the MIME type and decodes the image, rejects mismatches,
corrupt files and images exceeding 20 million pixels, then re-encodes without
embedded metadata. Invalid uploads return 400 in the standard error shape.
Files use random UUID names, exclusive creation, and server-selected extensions.
MongoDB stores only `uploads/<filename>`. The previous file is deleted after
the DB reference changes; a failed DB update removes the newly written file.
File deletion failures other than missing files surface as server errors and
may require filesystem cleanup; filesystem and MongoDB changes are not a single
transaction.

Images are served at `<API-origin>/uploads/<filename>` and require the owner's
Bearer token (401 without authentication, 404 for another user's photo).
The frontend should fetch the image with Authorization and display a Blob URL.
Local storage must be
persistent and writable and is intended for a single server with a shared DB.
Only `.gitkeep` is tracked under uploads. Back up photos alongside MongoDB.

## Schema and reuse

The User schema adds `photo`, nested `contactInfo.phone`, and nested notification
and monitoring preferences. Defaults: no photo, empty phone, all preferences true,
matching the teacher UI. Existing accounts get these defaults when serialized;
no migration or data backfill is required. Teacher-only fields remain separate
and read-only. Registration, login and profile endpoints share an explicit safe
serializer that never returns `_id`, password hashes, or internal fields.

Frontend integration is not included. Password reset, email verification, 2FA,
account deletion and immediate token revocation remain possible follow-ups.

## Run tests

From `backend`:

```powershell
npm install
node --test tests/profile.test.js
npm test
```

Tests use temporary MongoDB and an ephemeral HTTP port, requiring no configured
Atlas database or running dev server. The first run may download a MongoDB binary.
Photo tests use real JPEG/PNG files and remove their generated uploads afterward.
For manual Postman requests the regular server still requires a running MongoDB
and `MONGODB_URI`; temporary MongoDB is only started by the automated tests.
