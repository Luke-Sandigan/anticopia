import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  examId: { type: String, required: true },
  studentId: { type: String, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  released: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });
schema.index({ examId: 1, studentId: 1 }, { unique: true });
export const Grade = mongoose.model('Grade', schema);
