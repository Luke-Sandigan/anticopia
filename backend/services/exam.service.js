import { randomUUID } from 'node:crypto';
import { Exam } from '../models/exam.model.js';
import { Submission } from '../models/submission.model.js';
import { Grade } from '../models/grade.model.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { accessibleClass, fail, paginated, searchFilter, teacherOnly } from './class.service.js';
import { validSchedule } from '../validators/exam.validator.js';

export function examStatus(item, now = new Date()) {
  if (!item.published) return 'draft';
  if (item.endsAt && item.endsAt <= now) return 'past';
  return item.startsAt && item.startsAt > now ? 'scheduled' : 'ongoing';
}
export function publicExam(item, classItem, user) {
  return { id: item.examId, classId: item.classId, classCode: classItem.code,
    title: item.name, description: item.description ?? '', instructions: item.instructions ?? '',
    duration: item.duration ?? 90, passingScore: item.passingScore ?? 60,
    availableFrom: item.startsAt ?? null, availableUntil: item.endsAt ?? null,
    published: item.published, status: examStatus(item), archivedAt: item.archivedAt ?? null,
    detectTabSwitches: item.detectTabSwitches ?? true, detectMultiDevice: item.detectMultiDevice ?? true,
    captureScreenshots: item.captureScreenshots ?? false, questionCount: item.questions?.length ?? 0,
    ...(user.role === 'teacher' ? { questions: item.questions ?? [] } : {}),
    createdAt: item.createdAt, updatedAt: item.updatedAt };
}
export async function accessExam(examId, user, write = false, allowArchived = false) {
  if (write) teacherOnly(user);
  const item = await Exam.findOne({ examId }).lean();
  if (!item) fail(404, 'Exam not found');
  const classItem = await accessibleClass(item.classId, user, write);
  if (user.role === 'student' && (!item.published || item.archivedAt)) fail(404, 'Exam not found');
  if (write && item.archivedAt && !allowArchived) fail(409, 'Exam is archived');
  return { item, classItem };
}
async function assertEditable(item) {
  if (item.hasSubmissions || await Submission.exists({ examId: item.examId }) || await Grade.exists({ examId: item.examId })) fail(409, 'Exam has submissions and cannot be changed');
  if (item.published && item.startsAt && item.startsAt <= new Date()) fail(409, 'Exam has started and cannot be changed');
}
function assertPublishable(item) {
  if (!item.questions?.length) fail(409, 'At least one question is required to publish');
  validSchedule(item, true);
  if (item.endsAt <= new Date()) fail(409, 'Cannot publish an exam whose window has ended');
}
async function updateAtomically(item, changes, freezeAtStart = true) {
  const filter = { examId: item.examId, archivedAt: null,
    ...(item.revision === undefined ? { revision: { $exists: false } } : { revision: item.revision }) };
  if (freezeAtStart) {
    filter.hasSubmissions = { $ne: true };
    // Check the clock again inside MongoDB, including a start that occurs after
    // the service's first read. Revision protects concurrent teacher mutations.
    filter.$expr = { $or: [{ $ne: ['$published', true] }, { $gt: ['$startsAt', '$$NOW'] }] };
  }
  const result = await Exam.findOneAndUpdate(filter, { $set: changes, $inc: { revision: 1 } }, { new: true, runValidators: true }).lean();
  if (!result) fail(409, 'Exam changed, started or was archived; reload before retrying');
  return result;
}
export async function createExam(classId, user, input) {
  const classItem = await accessibleClass(classId, user, true);
  const values = { duration: 90, passingScore: 60, ...input };
  validSchedule(values);
  const item = (await Exam.create({ ...values, examId: randomUUID(), classId })).toObject();
  return publicExam(item, classItem, user);
}
export async function editExam(context, user, input) {
  await assertEditable(context.item);
  const merged = { ...context.item, ...input };
  validSchedule(merged);
  if (merged.published) assertPublishable(merged);
  return publicExam(await updateAtomically(context.item, input), context.classItem, user);
}
export async function publishExam(context, user, schedule) {
  await assertEditable(context.item);
  if (context.item.published) fail(409, 'Exam is already published');
  const merged = { ...context.item, ...schedule };
  assertPublishable(merged);
  if (schedule && merged.startsAt <= new Date()) fail(400, 'Scheduling requires a future start');
  const item = await updateAtomically(context.item, { ...schedule, published: true });
  return publicExam(item, context.classItem, user);
}
export async function unpublishExam(context, user) {
  await assertEditable(context.item);
  if (!context.item.published) fail(409, 'Exam is already a draft');
  return publicExam(await updateAtomically(context.item, { published: false }), context.classItem, user);
}
export async function duplicateExam(context, user) {
  const source = context.item;
  const item = (await Exam.create({ examId: randomUUID(), classId: source.classId, name: `${source.name.slice(0, 193)} (copy)`,
    description: source.description, instructions: source.instructions, duration: source.duration, passingScore: source.passingScore,
    questions: source.questions, detectTabSwitches: source.detectTabSwitches, detectMultiDevice: source.detectMultiDevice,
    captureScreenshots: source.captureScreenshots, published: false, startsAt: null, endsAt: null })).toObject();
  return publicExam(item, context.classItem, user);
}
export async function archiveExam(context) {
  // Archiving is allowed after submissions and never touches dependent records.
  await updateAtomically(context.item, { archivedAt: new Date() }, false);
}
export async function listExams(user, options) {
  if (user.role !== 'teacher' && user.role !== 'student') fail(403, 'Exam access denied');
  if (options.includeArchived && user.role !== 'teacher') fail(403, 'Teacher access required');
  let classes;
  if (options.classId) classes = [await accessibleClass(options.classId, user)];
  else {
    const ids = user.role === 'student' ? await Enrollment.distinct('classId', { userId: user.id, enrollment: 'Enrolled' }) : [];
    classes = await Class.find(user.role === 'teacher' ? { teacherId: user.id } : { classId: { $in: ids } }).lean();
  }
  const byId = new Map(classes.map((item) => [item.classId, item]));
  const now = new Date();
  const status = options.status === 'draft' ? { published: false }
    : options.status === 'scheduled' ? { published: true, startsAt: { $gt: now } }
      : options.status === 'ongoing' ? { published: true, startsAt: { $lte: now }, endsAt: { $gt: now } }
        : options.status === 'past' ? { published: true, endsAt: { $lte: now } } : {};
  const filter = { classId: { $in: [...byId.keys()] }, ...(options.includeArchived ? {} : { archivedAt: null }),
    ...status, ...searchFilter(options.search, ['name', 'description']) };
  if (user.role === 'student') {
    filter.published = true;
    if (options.status === 'draft') filter.examId = { $in: [] };
  }
  return paginated(Exam, filter, options, { createdAt: -1, examId: 1 }, (item) => {
    const { questions, ...summary } = publicExam(item, byId.get(item.classId), user);
    return summary;
  });
}
