import { randomBytes } from 'node:crypto';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';

const starterClasses = [
  { classId: 'it-201', name: 'IT-201 Data Structures', section: 'Section A', subject: 'Computer Science', term: 'Term 1, 2026', code: 'DS-4K9Q' },
  { classId: 'it-305', name: 'IT-305 Databases', section: 'Section B', subject: 'Information Technology', term: 'Term 1, 2026', code: 'DB-7M2X' },
  { classId: 'it-110', name: 'IT-110 Intro to Programming', section: 'Section C', subject: 'Information Technology', term: 'Term 1, 2026', code: 'IP-2H8R' },
];

const initialRoster = [
  { name: 'Maria Santos', studentId: '2023-0141', account: 'Active', performance: 88 },
  { name: 'Juan dela Cruz', studentId: '2023-0152', account: 'Active', performance: 74 },
  { name: 'Ana Reyes', studentId: '2023-0167', account: 'Active', performance: 91 },
  { name: 'Carlo Mendoza', studentId: '2023-0173', account: 'Active', performance: 67 },
  { name: 'Bea Lim', studentId: '2023-0188', account: 'Active', performance: 95 },
  { name: 'Paolo Garcia', studentId: '2023-0194', account: 'Not verified', performance: 58 },
  { name: 'Isa Navarro', studentId: '2023-0203', account: 'Active', performance: 82 },
  { name: 'Miguel Tan', studentId: '2023-0219', account: 'Active', performance: 79 },
];

function publicClass(classItem) {
  return {
    id: classItem.classId,
    name: classItem.name,
    section: classItem.section,
    subject: classItem.subject,
    term: classItem.term,
    code: classItem.code,
  };
}

function publicEnrollment(enrollment) {
  return {
    id: enrollment.studentId,
    name: enrollment.name,
    enrollment: enrollment.enrollment,
    account: enrollment.account,
    performance: enrollment.performance,
  };
}

function nameFromEmail(email) {
  return email.split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function seedClassData() {
  await Class.bulkWrite(starterClasses.map((classItem) => ({
    updateOne: { filter: { classId: classItem.classId }, update: { $setOnInsert: classItem }, upsert: true },
  })));

  const count = await Enrollment.countDocuments({ classId: 'it-201' });
  if (count === 0) {
    await Enrollment.insertMany(initialRoster.map((student) => ({ classId: 'it-201', enrollment: 'Enrolled', ...student })));
  }
}

export async function getClassDetails(classId) {
  const classItem = await Class.findOne({ classId }).lean();
  if (!classItem) return null;
  return publicClass(classItem);
}

export async function getRoster(classId) {
  const roster = await Enrollment.find({ classId }).sort({ name: 1 }).lean();
  return roster.map(publicEnrollment);
}

export async function addStudentToRoster(classId, rawIdentifier) {
  const identifier = rawIdentifier.trim();
  const email = identifier.includes('@') ? identifier.toLowerCase() : undefined;
  const studentId = email ? `NEW-${randomBytes(3).toString('hex').toUpperCase()}` : identifier;
  const enrollment = await Enrollment.create({
    classId,
    studentId,
    name: email ? nameFromEmail(email) : 'New student',
    ...(email ? { email } : {}),
  });
  return publicEnrollment(enrollment);
}

export async function removeStudentFromRoster(classId, studentId) {
  const result = await Enrollment.deleteOne({ classId, studentId });
  return result.deletedCount > 0;
}
