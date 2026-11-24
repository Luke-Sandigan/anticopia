import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  examId: { type: String, required: true, index: true },
  studentId: { type: String, required: true },
  type: { type: String, trim: true, maxlength: 100, default: null },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  evidence: mongoose.Schema.Types.Mixed,
}, { timestamps: true, versionKey: false });
schema.index({ examId: 1, studentId: 1, status: 1 });
export const Flag = mongoose.model('Flag', schema);
