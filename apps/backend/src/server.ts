// ─────────────────────────────────────────────────────────────────────────────
// 1. GLOBAL CATCH-ALLS
// ─────────────────────────────────────────────────────────────────────────────
process.on('uncaughtException', (err: Error) => {
  console.error('💥 Uncaught Exception! Shutting down...');
  console.error(err.name, err.message, err.stack);
  // If you have a logger, log here instead of console
  // Optionally: attempt a graceful shutdown
  process.exit(1); // exit with failure
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('⚠️  Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Optionally: if your app is unhealthy, shut down too:
  // server.close(() => process.exit(1));
});





import dotenv from 'dotenv';
dotenv.config(); 

console.log('DATABASE_URL:', process.env.DATABASE_URL);


import app from './app';
import connectDB from './shared/config/db';



const PORT = process.env.PORT || 5000;

// connectDB();
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


(async () => {

  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }

})();
