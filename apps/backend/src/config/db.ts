import { Sequelize } from 'sequelize';

const isTest = process.env.NODE_ENV === 'test';

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
    await sequelize.sync(); // in prod/dev, you might use migrations instead
    console.log('Database connected & synced');
  } catch (err) {
    console.error('DB connection error:', (err as Error).message);
    process.exit(1);
  }
};

export default connectDB;
