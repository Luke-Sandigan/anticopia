import { addStudentToRoster, getClassDetails, getRoster, removeStudentFromRoster } from '../services/class.service.js';
import { validateStudentIdentifier } from '../validators/class.validator.js';

function notFound(response) {
  return response.status(404).json({ error: 'Class not found' });
}

async function classExists(classId) {
  return Boolean(await getClassDetails(classId));
}

export async function getClass(request, response) {
  const classItem = await getClassDetails(request.params.classId);
  if (!classItem) return notFound(response);
  return response.status(200).json({ class: classItem });
}

export async function getClassRoster(request, response) {
  const { classId } = request.params;
  if (!(await classExists(classId))) return notFound(response);
  return response.status(200).json({ roster: await getRoster(classId) });
}

export async function addStudent(request, response) {
  const errors = validateStudentIdentifier(request.body);
  if (errors.length) return response.status(400).json({ error: 'Validation failed', details: errors });
  const { classId } = request.params;
  if (!(await classExists(classId))) return notFound(response);
  const student = await addStudentToRoster(classId, request.body.identifier);
  return response.status(201).json({ student });
}

export async function removeStudent(request, response) {
  const { classId, studentId } = request.params;
  if (!(await classExists(classId))) return notFound(response);
  const removed = await removeStudentFromRoster(classId, studentId);
  if (!removed) return response.status(404).json({ error: 'Student is not enrolled in this class' });
  return response.sendStatus(204);
}
