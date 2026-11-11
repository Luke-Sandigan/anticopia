const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(role, body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['A JSON object is required'];
  const { firstName, lastName, email, password } = body;
  const errors = [];

  if (typeof firstName !== 'string' || !firstName.trim()) errors.push('firstName is required');
  if (typeof lastName !== 'string' || !lastName.trim()) errors.push('lastName is required');
  if (typeof email !== 'string' || !emailPattern.test(email.trim())) errors.push('A valid email is required');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    errors.push('password must be between 8 and 128 characters');
  }

  const identifierField = role === 'teacher' ? 'employeeId' : 'studentId';
  if (typeof body[identifierField] !== 'string' || !body[identifierField].trim()) {
    errors.push(`${identifierField} is required`);
  }
  if (role === 'teacher' && (typeof body.department !== 'string' || !body.department.trim())) {
    errors.push('department is required');
  }

  return errors;
}

export function validateLogin(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return ['A JSON object is required'];
  const errors = [];
  if (typeof body.email !== 'string' || !emailPattern.test(body.email.trim())) errors.push('A valid email is required');
  if (typeof body.password !== 'string' || !body.password) errors.push('password is required');
  if (!['teacher', 'student'].includes(body.role)) errors.push('role must be teacher or student');
  return errors;
}
