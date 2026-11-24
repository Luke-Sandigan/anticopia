import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  classId: { type: String, required: true, index: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  userId: String,
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  enrollment: { type: String, enum: ['Enrolled', 'Removed'], default: 'Enrolled' },
  removedAt: { type: Date, default: null },
  history: [{ _id: false, action: { type: String, enum: ['joined', 'removed'] }, at: Date }],
  account: { type: String, enum: ['Active', 'Not verified'], default: 'Not verified' },
  performance: { type: Number, min: 0, max: 100, default: 0 },
}, { timestamps: true, versionKey: false });

enrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });
enrollmentSchema.index({ classId: 1, userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'string' } } });
// A compound sparse index would still index records with a classId and no email
// as `{ email: null }`. Restrict this unique index to records that have an email.
enrollmentSchema.index(
  { classId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
