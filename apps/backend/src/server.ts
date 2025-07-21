import dotenv from 'dotenv';
dotenv.config(); 

import app from './app';
import connectDB from './shared/config/db';



const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
