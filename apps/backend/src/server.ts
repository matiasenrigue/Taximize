import dotenv from 'dotenv';
dotenv.config(); 

console.log('DATABASE_URL:', process.env.DATABASE_URL);


import app from './app';
import connectDB from './config/db';


connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
