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
