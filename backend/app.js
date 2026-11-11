import express from 'express';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use((error, _request, response, _next) => {
  const status = error.statusCode ?? 500;
  response.status(status).json({
    error: status === 500 ? 'Internal server error' : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
});

export default app;
