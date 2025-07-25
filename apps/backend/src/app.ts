import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './entities/auth/auth.routes';
import rideRoutes from './entities/rides/ride.routes';
import shiftRoutes from './entities/shifts/shift.routes';
import userRoutes from './entities/users/user.routes';
import hotspotsRoutes from './entities/hotspots/hotspots.routes';
import statsRoutes from './entities/stats/stats.routes';
import { errorHandler } from './shared/middleware/error.middleware';

const app = express();

// Debugging middleware
app.use((req, res, next) => {
    console.log(`→ ${req.method} ${req.originalUrl}`);
    next();
});

// Security HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting - COMMENTED OUT FOR DEVELOPMENT
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100 * 1000, // limit each IP to 100,000 requests per window Ms (increased by 1000x)
//     message: 'Too many requests from this IP, please try again later.',
//     standardHeaders: true,
//     legacyHeaders: false,
// });
// app.use('/api/', limiter);


app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hotspots', hotspotsRoutes);
app.use('/api/stats', statsRoutes);

app.use(errorHandler);

export default app;
