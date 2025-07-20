// src/config/db.ts
import { Sequelize } from 'sequelize';
import { initializeAssociations } from './associations';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';


export const sequelize = isTest
    ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    : new Sequelize(process.env.DATABASE_URL!, {
            dialect: 'postgres',
            protocol: 'postgres',
            logging: false,
        });

const connectDB = async () => {
    try {
        await sequelize.authenticate();

        // Initialize model associations before sync
        initializeAssociations();

        if (!isProd) {
            // in dev & test, auto-create/alter tables to match models
            await sequelize.sync({ alter: true });
            console.log('👉 DB synced (alter)');
        } else {
            console.log('⚠️  In production, run migrations instead of sync()');
        }

        console.log('✅ Database connected');
    } catch (err) {
        console.error('DB connection error:', (err as Error).message);
        process.exit(1);
    }
};

export default connectDB;
