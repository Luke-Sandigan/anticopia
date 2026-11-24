import { User } from '../models/user.model.js';
import { hashPassword, verifyPassword, publicUser } from './auth.service.js';

export function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export async function updateProfile(id, input) {
  const updates = {};
  for (const field of ['firstName', 'lastName', 'email']) {
    if (field in input) updates[field] = field === 'email' ? input[field].trim().toLowerCase() : input[field].trim();
  }
  if (input.contactInfo && 'phone' in input.contactInfo) updates['contactInfo.phone'] = input.contactInfo.phone.trim();
  for (const [group, values] of Object.entries(input.preferences ?? {})) {
    for (const [key, value] of Object.entries(values)) updates[`preferences.${group}.${key}`] = value;
  }
  try {
    const user = await User.findOneAndUpdate({ id }, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!user) fail(404, 'Account not found');
    return publicUser(user);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) fail(409, 'An account with this email already exists');
    throw error;
  }
}

export async function changePassword(user, { currentPassword, newPassword }) {
  if (!(await verifyPassword(currentPassword, user.passwordHash))) fail(401, 'Current password is incorrect');
  if (currentPassword === newPassword) fail(400, 'New password must differ from the current password');
  const passwordHash = await hashPassword(newPassword);
  const result = await User.updateOne({ id: user.id, 'passwordHash.hash': user.passwordHash.hash }, { $set: { passwordHash } });
  if (!result.matchedCount) fail(409, 'Account credentials changed; please try again');
}
