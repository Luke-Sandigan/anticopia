import mongoose from 'mongoose';
import { Class } from './models/class.model.js';
import { Enrollment } from './models/enrollment.model.js';
import { seedClassData } from './services/class.service.js';

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
  await seedClassData();
  console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);
}
