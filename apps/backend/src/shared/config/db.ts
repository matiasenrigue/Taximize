import { Sequelize, DataTypes, Model } from 'sequelize';
import { initializeAssociations } from './associations';

export { DataTypes, Model };

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';


export const sequelize = isTest
    ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    : new Sequelize(process.env.DATABASE_URL!, {
            dialect: 'postgres',
            protocol: 'postgres',
            logging: false,
            pool: {
                max: parseInt(process.env.DB_POOL_MAX || '20'),
                min: parseInt(process.env.DB_POOL_MIN || '5'),
                acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000'),
                idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
                evict: parseInt(process.env.DB_POOL_EVICT || '1000')
            }
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
