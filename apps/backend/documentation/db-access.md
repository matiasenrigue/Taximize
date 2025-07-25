# Database Access Commands

## Docker Database Access

### Connect to PostgreSQL container
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp
```

### List all databases
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d postgres -c "\l"
```

### List all tables in taxiapp database
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp -c "\dt"
```

### Show table structure
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp -c "\d <table_name>"
# Example:
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp -c "\d users"
```

### Execute SQL queries
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp -c "<SQL_QUERY>"
```

## Common Migrations

### Add preferences column to users table
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp -c "ALTER TABLE users ADD COLUMN preferences JSON DEFAULT '{}';"
```

### Check if column exists
```bash
sudo docker compose -f docker-compose.nginx.yml exec db psql -U MatiasUCD -d taxiapp -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences';"
```

## Backend Container Access

### Access backend shell
```bash
sudo docker compose -f docker-compose.nginx.yml exec backend sh
```

### Run sync-db script
```bash
sudo docker compose -f docker-compose.nginx.yml exec backend npm run sync-db
```

## Database Configuration

- **Database Name**: `taxiapp` (lowercase)
- **Users**: 
  - `MatiasUCD` (password: `12345678`) - Main admin user
  - `TaxiDriver` (password: `group6UCD`) - Application user
- **Host** (from containers): `db`
- **Port**: `5432`
- **Volume**: `postgres_data` (persists data between container restarts)