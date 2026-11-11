import mongoose from 'mongoose';
import { Class } from './models/class.model.js';
import { Enrollment } from './models/enrollment.model.js';
import { User } from './models/user.model.js';
import { Exam } from './models/exam.model.js';
import { Grade } from './models/grade.model.js';
import { Flag } from './models/flag.model.js';
import { Submission } from './models/submission.model.js';
import { Question } from './models/question.model.js';

async function ensureEnrollmentIndexes() {
  let indexes = [];
  try {
    indexes = await Enrollment.collection.indexes();
  } catch (error) {
    if (error?.codeName !== 'NamespaceNotFound') throw error;
  }
  const emailIndex = indexes.find((index) => index.name === 'classId_1_email_1');
  const hasExpectedFilter = emailIndex?.unique
    && emailIndex.partialFilterExpression?.email?.$type === 'string';

  if (emailIndex && !hasExpectedFilter) {
    await Enrollment.collection.dropIndex(emailIndex.name);
  }

  await Enrollment.collection.createIndex({ classId: 1 }, { name: 'classId_1' });
  await Enrollment.collection.createIndex(
    { classId: 1, email: 1 },
    {
      name: 'classId_1_email_1',
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } },
    },
  );
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Copy .env.example to .env and set it to your MongoDB connection string.');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: false,
  });
  await Class.createIndexes();
  await ensureEnrollmentIndexes();
  await Enrollment.createIndexes();
  await Promise.all([User.createIndexes(), Exam.createIndexes(), Grade.createIndexes(), Flag.createIndexes(), Submission.createIndexes(), Question.createIndexes()]);
  // Additive backfill: preserve string class IDs, records and evidence. Legacy
  // owners must be assigned explicitly; never infer an owner from a login.
  await Class.updateMany({ status: { $exists: false } }, { $set: { status: 'active', archivedAt: null } });
  await Exam.updateMany({ revision: { $exists: false } }, { $set: { revision: 0 } });
  console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);
}
