import * as service from '../services/student.service.js';

export async function getGrades(request, response) {
  const classId = request.query.classId;

  const result = await service.getStudentGrades(
    request.user,
    classId
  );

  return response.json(result);
}


export async function getExamHistory(request, response) {
  const result = await service.getExamHistory(
    request.user,
    request.query
  );

  return response.json(result);
}
