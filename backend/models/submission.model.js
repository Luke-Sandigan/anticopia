import mongoose from 'mongoose';
import { Exam } from './exam.model.js';

// A conservative edit lock: even an in-progress attempt freezes exam settings.
// Lock the parent before inserting so concurrent settings edits use the same
// revision guard. Removing a submission never clears this historical lock.
async function lockExam(examId) {
  const result = await Exam.updateOne({ examId }, { $set: { hasSubmissions: true }, $inc: { revision: 1 } });
  if (!result.matchedCount) throw Object.assign(new Error('Exam not found'), { statusCode: 404 });
}
const schema = new mongoose.Schema({
  examId: { type: String, required: true, index: true },
  studentId: { type: String, required: true },
  status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
  submittedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });
schema.pre('save', async function () { if (this.isNew) await lockExam(this.examId); });
schema.pre('insertMany', async function (next, documents) {
  try {
    for (const examId of new Set(documents.map((item) => item.examId))) await lockExam(examId);
    next();
  } catch (error) { next(error); }
});
export const Submission = mongoose.model('Submission', schema);
