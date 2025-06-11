import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();

// Debugging middleware
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// Seguridad HTTP headers
// app.use(helmet());

// CORS
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL, // definir en .env
//     credentials: true,
//   })
// );
app.use(cors());       // 🚨 opens CORS to every origin


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);


app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;
