import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  classId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  term: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  teacherId: { type: String, index: true },
  schedule: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  archivedAt: { type: Date, default: null },
  joinCode: String,
}, { timestamps: true, versionKey: false });

classSchema.index({ joinCode: 1 }, { unique: true, partialFilterExpression: { joinCode: { $type: 'string' } } });

export const Class = mongoose.model('Class', classSchema);
