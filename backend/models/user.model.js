import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  firstName: String, lastName: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  employeeId: String, studentId: String, department: String,
  passwordHash: { salt: String, hash: String },
}, { timestamps: true, versionKey: false });
for (const field of ['employeeId', 'studentId']) {
  schema.index({ [field]: 1 }, { unique: true, partialFilterExpression: { [field]: { $type: 'string' } } });
}
export const User = mongoose.model('User', schema);

export function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() }).lean();
}

export function findUserByIdentifier(field, value) {
  return User.findOne({ [field]: value }).collation({ locale: 'en', strength: 2 }).lean();
}

export async function saveUser(user) {
  return (await User.create(user)).toObject();
}
