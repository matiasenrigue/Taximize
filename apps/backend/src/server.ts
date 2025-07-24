import dotenv from 'dotenv';
dotenv.config(); 

import app from './app';
import connectDB from './shared/config/db';
import { connectRedis } from './shared/config/redis';



const PORT = process.env.PORT || 5000;

// Start server with DB and Redis connections
const startServer = async () => {
    try {
        // Connect to database (required)
        await connectDB();
        
        // Connect to Redis (optional --> app continues if unavailable)
        await connectRedis();
        
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
