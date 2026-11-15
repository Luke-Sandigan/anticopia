import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { User } from '../models/user.model.js';
import { publicUser } from './auth.service.js';
import { fail } from './profile.service.js';

export const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  fileFilter(_request, file, callback) {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      const error = new Error('Photo must be JPEG or PNG');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  },
}).single('photo');

export function parsePhoto(request, response, next) {
  parser(request, response, (error) => {
    if (error) {
      error.statusCode = 400;
      if (error.code === 'LIMIT_FILE_SIZE') error.message = 'Photo must not exceed 2 MB';
    }
    next(error);
  });
}

async function removePhoto(reference) {
  // Only delete files owned by this uploader, never arbitrary stored paths.
  if (!/^uploads\/[0-9a-f-]{36}\.(png|jpg)$/.test(reference ?? '')) return;
  try { await unlink(join(uploadDirectory, reference.slice('uploads/'.length))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

export async function uploadPhoto(request, response) {
  if (!request.file) fail(400, 'A photo file is required');
  let bytes, format;
  try {
    const image = sharp(request.file.buffer, { limitInputPixels: 20_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    format = metadata.format;
    if (!['jpeg', 'png'].includes(format) || request.file.mimetype !== `image/${format}`) fail(400, 'Photo content must match its JPEG or PNG type');
    // Decode and re-encode to reject corrupt images and discard embedded metadata.
    bytes = await image.toFormat(format).toBuffer();
  } catch {
    fail(400, 'Photo must contain a valid JPEG or PNG image (maximum 20 million pixels)');
  }
  const name = `${randomUUID()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  const reference = `uploads/${name}`;
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(join(uploadDirectory, name), bytes, { flag: 'wx' });
  let previous;
  try {
    previous = await User.findOneAndUpdate({ id: request.user.id }, { $set: { photo: reference } }).lean();
    if (!previous) fail(404, 'Account not found');
  } catch (error) {
    await removePhoto(reference);
    throw error;
  }
  await removePhoto(previous.photo);
  return response.json({ user: publicUser({ ...previous, photo: reference }) });
}
