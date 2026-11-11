import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  topic: { type: String, default: '' },
  type: { type: String, enum: ['Multiple choice', 'True/false', 'Short answer', 'Essay'], required: true },
  question: { type: String, required: true },
  points: { type: Number, required: true, min: 0.01 },
  choices: [String],
  correctAnswer: String,
}, { _id: false });

const schema = new mongoose.Schema({
  examId: { type: String, required: true, unique: true },
  classId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  duration: { type: Number, min: 1, max: 1440, default: 90 },
  passingScore: { type: Number, min: 0, max: 100, default: 60 },
  detectTabSwitches: { type: Boolean, default: true },
  detectMultiDevice: { type: Boolean, default: true },
  captureScreenshots: { type: Boolean, default: false },
  questions: { type: [questionSchema], default: [] },
  published: { type: Boolean, default: false },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
  hasSubmissions: { type: Boolean, default: false },
  revision: { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });
schema.index({ classId: 1, archivedAt: 1, published: 1, startsAt: 1 });
export const Exam = mongoose.model('Exam', schema);
