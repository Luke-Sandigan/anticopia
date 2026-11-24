import { loginUser, registerUser } from '../services/auth.service.js';
import { validateLogin, validateRegistration } from '../validators/auth.validator.js';

function rejectInvalid(errors) {
  if (errors.length) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }
}

export async function register(request, response) {
  const { role } = request.params;
  if (!['teacher', 'student'].includes(role)) {
    return response.status(404).json({ error: 'Registration role must be teacher or student' });
  }
  rejectInvalid(validateRegistration(role, request.body));
  const result = await registerUser(role, request.body);
  return response.status(201).json({ message: 'Account created', ...result });
}

export async function login(request, response) {
  rejectInvalid(validateLogin(request.body));
  const result = await loginUser(request.body);
  return response.status(200).json({ message: 'Login successful', ...result });
}
