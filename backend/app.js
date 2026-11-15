import express from 'express';
import authRoutes from './routes/auth.routes.js';
import classRoutes from './routes/class.routes.js';
import healthRoutes from './routes/health.routes.js';
import examRoutes from './routes/exam.routes.js';
import questionRoutes from './routes/question.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import gradebookRoutes from './routes/gradebook.routes.js';
import { uploadDirectory } from './services/photo.service.js';
import { authenticate } from './services/auth.service.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim());

app.use((request, response, next) => {
  const origin = request.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.set('Access-Control-Allow-Origin', origin);
    response.set('Vary', 'Origin');
    response.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    response.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  return next();
});

app.use(express.json());
app.use('/uploads', authenticate, (request, response, next) => {
  if (request.user.photo !== `uploads${request.path}`) return response.status(404).json({ error: 'Photo not found' });
  return next();
}, express.static(uploadDirectory, { dotfiles: 'deny', index: false, setHeaders(response) {
  response.set('X-Content-Type-Options', 'nosniff');
  response.set('Cache-Control', 'private, no-store');
} }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/gradebook', gradebookRoutes);
app.use((_request, response) => response.status(404).json({ error: 'Route not found' }));

app.use((error, _request, response, _next) => {
  if (error?.code === 11000) {
    return response.status(409).json({ error: 'A record with that unique identifier already exists' });
  }
  const status = error.type === 'entity.parse.failed' ? 400 : error.statusCode ?? 500;
  return response.status(status).json({
    error: error.type === 'entity.parse.failed' ? 'Invalid JSON body' : status === 500 ? 'Internal server error' : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
});

export default app;
