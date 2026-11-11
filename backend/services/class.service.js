import { randomBytes } from 'node:crypto';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { User, findUserByEmail, findUserByIdentifier } from '../models/user.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { Flag } from '../models/flag.model.js';

export function fail(statusCode, message) {
  throw Object.assign(new Error(message), { statusCode });
}
export function teacherOnly(user) {
  if (user.role !== 'teacher') fail(403, 'Teacher access required');
}
export async function accessibleClass(classId, user, write = false) {
  if (write) teacherOnly(user);
  const item = await Class.findOne({ classId }).lean();
  if (!item) fail(404, 'Class not found');
  if (user.role === 'teacher') {
    if (item.teacherId !== user.id) fail(403, 'You do not own this class');
  } else if (user.role !== 'student' || !await Enrollment.exists({ classId, userId: user.id, enrollment: 'Enrolled' })) {
    fail(403, 'Active enrollment required');
  }
  if (write && item.status === 'archived') fail(409, 'Class is archived');
  return item;
}
export function publicEnrollment(item) {
  return { id: item.studentId, userId: item.userId, name: item.name, email: item.email,
    enrollment: item.enrollment, account: item.account, performance: item.performance };
}
export async function getSummary(classId, user) {
  const student = user.role === 'student';
  const exams = await Exam.find({ classId, ...(student ? { published: true } : {}) }).select('examId').lean();
  const ids = exams.map((item) => item.examId);
  const [studentCount, openFlagCount, grades] = await Promise.all([
    Enrollment.countDocuments({ classId, enrollment: 'Enrolled' }),
    Flag.countDocuments({ examId: { $in: ids }, status: 'open', ...(student ? { studentId: user.studentId } : {}) }),
    Grade.aggregate([
      { $match: { examId: { $in: ids }, ...(student ? { studentId: user.studentId, released: true } : {}) } },
      { $group: { _id: null, average: { $avg: '$percentage' } } },
    ]),
  ]);
  return { studentCount, examCount: ids.length, averageGrade: grades[0]?.average ?? null, openFlagCount };
}
export async function getClassDetails(item, user) {
  const teacher = await User.findOne({ id: item.teacherId, role: 'teacher' }).lean();
  return { id: item.classId, name: item.name, code: item.code, section: item.section,
    subject: item.subject, term: item.term, schedule: item.schedule ?? '', description: item.description ?? '',
    status: item.status ?? 'active', archivedAt: item.archivedAt ?? null,
    ...(user.role === 'teacher' ? { joinCode: item.joinCode ?? null } : {}),
    teacher: teacher ? { id: teacher.id, firstName: teacher.firstName, lastName: teacher.lastName, email: teacher.email } : null,
    summary: await getSummary(item.classId, user) };
}
export function searchFilter(search, fields) {
  if (!search) return {};
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $or: fields.map((field) => ({ [field]: { $regex: escaped, $options: 'i' } })) };
}
export async function paginated(model, filter, options, sort, map) {
  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip((options.page - 1) * options.limit).limit(options.limit).lean(),
    model.countDocuments(filter),
  ]);
  return { items: await Promise.all(items.map(map)), pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) } };
}
export async function getClasses(user, options) {
  const classIds = user.role === 'student'
    ? await Enrollment.distinct('classId', { userId: user.id, enrollment: 'Enrolled' }) : [];
  const filter = { ...(user.role === 'teacher' ? { teacherId: user.id } : { classId: { $in: classIds } }),
    ...(options.includeArchived ? {} : { status: { $ne: 'archived' } }),
    ...searchFilter(options.search, ['name', 'code', 'section']) };
  return paginated(Class, filter, options, { name: 1, classId: 1 }, (item) => getClassDetails(item, user));
}
export async function getRoster(classId, options) {
  return paginated(Enrollment, { classId, enrollment: 'Enrolled', ...searchFilter(options.search, ['name', 'studentId', 'email']) },
    options, { name: 1, studentId: 1 }, publicEnrollment);
}
export async function enroll(classId, student) {
  const now = new Date();
  // Atomic reactivation preserves the original row and history. A unique index
  // arbitrates simultaneous first enrollments and returns a conflict to the loser.
  const existing = await Enrollment.findOneAndUpdate(
    { classId, studentId: student.studentId, enrollment: 'Removed' },
    { $set: { enrollment: 'Enrolled', removedAt: null, userId: student.id }, $push: { history: { action: 'joined', at: now } } },
    { new: true },
  );
  if (existing) return publicEnrollment(existing);
  if (await Enrollment.exists({ classId, studentId: student.studentId })) fail(409, 'Student is already enrolled');
  return publicEnrollment(await Enrollment.create({ classId, studentId: student.studentId, userId: student.id,
    name: `${student.firstName} ${student.lastName}`, email: student.email, account: 'Active', history: [{ action: 'joined', at: now }] }));
}
export async function addStudentToRoster(classId, identifier) {
  const student = identifier.includes('@') ? await findUserByEmail(identifier) : await findUserByIdentifier('studentId', identifier);
  if (!student || student.role !== 'student') fail(404, 'Student account not found');
  return enroll(classId, student);
}
export async function removeStudentFromRoster(classId, studentId) {
  const now = new Date();
  const result = await Enrollment.updateOne({ classId, studentId, enrollment: 'Enrolled' },
    { $set: { enrollment: 'Removed', removedAt: now }, $push: { history: { action: 'removed', at: now } } });
  if (!result.modifiedCount) fail(404, 'Student is not enrolled in this class');
}
export async function regenerateJoinCode(classId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = randomBytes(6).toString('hex').toUpperCase();
    try {
      const item = await Class.findOneAndUpdate({ classId, status: { $ne: 'archived' }, joinCode: { $ne: joinCode } },
        { $set: { joinCode } }, { new: true });
      if (item) return joinCode;
      fail(409, 'Class is archived or changed; retry');
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.joinCode) throw error;
    }
  }
  fail(409, 'Could not allocate a join code; retry');
}
export async function joinClass(joinCode, user) {
  if (user.role !== 'student') fail(403, 'Student access required');
  const item = await Class.findOne({ joinCode, status: { $ne: 'archived' } }).lean();
  if (!item) fail(404, 'Join code not found');
  return { classId: item.classId, student: await enroll(item.classId, user) };
}
export async function getExams(classId, user, options) {
  const now = new Date();
  const timing = options.status === 'upcoming' ? { startsAt: { $gt: now } }
    : options.status === 'ongoing' ? { startsAt: { $lte: now }, endsAt: { $gt: now } }
      : options.status === 'past' ? { endsAt: { $lte: now } } : {};
  return paginated(Exam, { classId, ...(user.role === 'student' ? { published: true } : {}), ...timing,
    ...searchFilter(options.search, ['name']) }, options, { startsAt: 1, examId: 1 },
  (item) => ({ id: item.examId, classId, name: item.name, published: item.published, startsAt: item.startsAt, endsAt: item.endsAt,
    status: item.startsAt > now ? 'upcoming' : item.endsAt > now ? 'ongoing' : 'past' }));
}
