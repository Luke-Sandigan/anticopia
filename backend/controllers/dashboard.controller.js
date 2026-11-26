import * as service from '../services/dashboard.service.js';

export async function getTeacherDashboard(request, response) {
  response.set('Cache-Control', 'private, no-store');
  return response.json(await service.getTeacherDashboard(request.user));
}
