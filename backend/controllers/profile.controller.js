import { publicUser } from '../services/auth.service.js';
import { updateProfile, changePassword } from '../services/profile.service.js';
import { validateProfile, validatePasswordChange } from '../validators/profile.validator.js';

function rejectInvalid(errors) {
  if (!errors.length) return;
  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.details = errors;
  throw error;
}

export function getProfile(request, response) {
  return response.json({ user: publicUser(request.user) });
}

export async function patchProfile(request, response) {
  rejectInvalid(validateProfile(request.body));
  return response.json({ user: await updateProfile(request.user.id, request.body) });
}

export async function postPassword(request, response) {
  rejectInvalid(validatePasswordChange(request.body));
  await changePassword(request.user, request.body);
  return response.json({ message: 'Password changed successfully' });
}
