import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  classId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  term: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
}, { timestamps: true, versionKey: false });

export const Class = mongoose.model('Class', classSchema);
