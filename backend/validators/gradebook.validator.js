import { fail } from '../services/class.service.js';
import { onlyFields } from './class.validator.js';

export function gradeOverride(body) {
  onlyFields(body, ['percentage', 'reason']);
  if (typeof body.percentage !== 'number' || !Number.isFinite(body.percentage) || body.percentage < 0 || body.percentage > 100) {
    fail(400, 'percentage must be between 0 and 100');
  }
  if (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.trim().length > 2000) {
    fail(400, 'reason is required and must be at most 2000 characters');
  }
  return { percentage: body.percentage, reason: body.reason.trim() };
}
