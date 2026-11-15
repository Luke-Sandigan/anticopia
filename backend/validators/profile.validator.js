import { validPassword } from './auth.validator.js';

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkObject(value, allowed, path, errors) {
  if (!object(value)) { errors.push(`${path} must be an object`); return false; }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${path}.${key} is not allowed`);
  }
  return true;
}

export function validateProfile(body) {
  const errors = [];
  if (!checkObject(body, ['firstName', 'lastName', 'email', 'contactInfo', 'preferences'], 'body', errors)) return errors;
  if (!Object.keys(body).length) errors.push('At least one profile field is required');
  for (const field of ['firstName', 'lastName']) {
    if (field in body && (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 100)) errors.push(`${field} must contain 1 to 100 characters`);
  }
  if ('email' in body && (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) errors.push('A valid email is required');
  if ('contactInfo' in body && checkObject(body.contactInfo, ['phone'], 'contactInfo', errors)) {
    if ('phone' in body.contactInfo && (typeof body.contactInfo.phone !== 'string' || body.contactInfo.phone.length > 50)) errors.push('contactInfo.phone must be a string of at most 50 characters');
  }
  if ('preferences' in body && checkObject(body.preferences, ['notifications', 'monitoring'], 'preferences', errors)) {
    for (const [group, keys] of Object.entries({ notifications: ['examUpdatesEmail', 'flaggedEventAlerts'], monitoring: ['soundOnAlert', 'groupRepeatedEvents'] })) {
      if (group in body.preferences && checkObject(body.preferences[group], keys, `preferences.${group}`, errors)) {
        for (const key of keys) if (key in body.preferences[group] && typeof body.preferences[group][key] !== 'boolean') errors.push(`preferences.${group}.${key} must be a boolean`);
      }
    }
  }
  return errors;
}

export function validatePasswordChange(body) {
  const errors = [];
  if (!checkObject(body, ['currentPassword', 'newPassword'], 'body', errors)) return errors;
  if (typeof body.currentPassword !== 'string' || !body.currentPassword || body.currentPassword.length > 128) errors.push('currentPassword is required and must be at most 128 characters');
  if (!validPassword(body.newPassword)) errors.push('newPassword must be between 8 and 128 characters');
  return errors;
}
