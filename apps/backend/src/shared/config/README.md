# Config

Database and caching configuration for the backend application.

## Files

- `db.ts` - PostgreSQL connection with Sequelize and connection pooling
- `redis.ts` - Redis client for caching expensive operations (optional)
- `associations.ts` - Sequelize model relationships
- `scripts/` - Database setup and sync utilities
