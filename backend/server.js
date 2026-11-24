
import app from './app.js';
import { connectToDatabase } from './database.js';
import { startAttemptExpiryWorker } from './services/attempt-expiry.service.js';

const PORT = process.env.PORT || 3000;

// Connect to MongoDB first.
await connectToDatabase();

// Start the automatic exam submission worker.
startAttemptExpiryWorker();

// Start the Express server.
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
