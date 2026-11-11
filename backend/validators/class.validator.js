export function validateStudentIdentifier(body = {}) {
  if (typeof body.identifier !== 'string' || !body.identifier.trim()) {
    return ['identifier is required'];
  }
  if (body.identifier.trim().length > 254) return ['identifier must be 254 characters or fewer'];
  return [];
}
