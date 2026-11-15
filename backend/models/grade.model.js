import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const overrideSchema = new mongoose.Schema({
  previousPercentage: { type: Number, required: true, min: 0, max: 100 },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  reason: { type: String, required: true, maxlength: 2000 },
  overriddenBy: { type: String, required: true },
  overriddenAt: { type: Date, required: true },
}, { _id: false });

const schema = new mongoose.Schema({
  gradeId: { type: String, required: true, unique: true, index: true, default: () => randomUUID() },
  examId: { type: String, required: true },
  studentId: { type: String, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  released: { type: Boolean, default: false },
  overrides: { type: [overrideSchema], default: [] },
}, { timestamps: true, versionKey: false });
schema.index({ examId: 1, studentId: 1 }, { unique: true });
export const Grade = mongoose.model('Grade', schema);
