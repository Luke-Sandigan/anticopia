import app from './app.js';
import { connectToDatabase } from './database.js';

const port = Number(process.env.PORT) || 5000;

async function start() {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`ANTICOPIA Express server listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('ANTICOPIA backend failed to start:', error.message);
  process.exitCode = 1;
});
