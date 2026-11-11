import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  examId: { type: String, required: true, unique: true },
  classId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  published: { type: Boolean, default: false },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true, validate: function (value) { return value > this.startsAt; } },
}, { timestamps: true, versionKey: false });
export const Exam = mongoose.model('Exam', schema);
