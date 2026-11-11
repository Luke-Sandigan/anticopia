import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  questionId: { type: String, required: true, unique: true },
  teacherId: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'true_false', 'essay'], required: true },
  topic: { type: String, default: '' },
  options: { type: [String], default: [] },
  correctAnswer: String,
  points: { type: Number, required: true, min: 0.01, max: 10000 },
  deletedAt: { type: Date, default: null },
  revision: { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });
schema.index({ teacherId: 1, deletedAt: 1, type: 1, createdAt: -1 });
export const Question = mongoose.model('Question', schema);
