import express from 'express';
import healthRoutes from './routes/health.routes.js';

const app = express();

app.use(express.json());
app.use('/api/health', healthRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

export default app;
