import 'dotenv/config';
import { sequelize } from '../shared/config/db';
import { initializeAssociations } from '../shared/config/associations';

async function syncDatabase() {
    try {
        console.log('🔄 Starting database sync...');
        
        // Authenticate connection
        await sequelize.authenticate();
        console.log('✅ Database connection authenticated');
        
        // Initialize all model associations
        initializeAssociations();
        
        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully');
        
        // List all tables
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('📋 Current tables:', tables);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database sync failed:', error);
        process.exit(1);
    }
}

syncDatabase();