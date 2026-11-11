import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  examId: { type: String, required: true, index: true },
  studentId: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
  evidence: mongoose.Schema.Types.Mixed,
}, { timestamps: true, versionKey: false });
export const Flag = mongoose.model('Flag', schema);
