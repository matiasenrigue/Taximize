# Installation Instructions

This guide will help you set up the backend application with PostgreSQL database locally.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

## Database Setup

### 1. Install PostgreSQL

**macOS:**
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Verify installation
pg_isready
```

**Linux/Ubuntu:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Verify installation
sudo -u postgres pg_isready
```

**Windows:**
Download and install PostgreSQL from [official website](https://www.postgresql.org/download/windows/)

### 2. Create Database and Users

Connect to PostgreSQL:
```bash
psql -d postgres
```

Execute the following SQL commands:
```sql
-- Create a superuser for admin tasks
CREATE ROLE "MatiasUCD"
  WITH LOGIN
       SUPERUSER
       PASSWORD 'YOUR_ADMIN_PASSWORD_HERE';

-- Create application user
CREATE ROLE "TaxiDriver"
  WITH LOGIN
       PASSWORD 'group6UCD';

-- Create the application database
CREATE DATABASE "TaxiAPP"
  OWNER "TaxiDriver";

-- Exit PostgreSQL
\q
```

## Application Setup

### 1. Environment Configuration

Create a `.env` file in the project root with the following content:

```bash
# PostgreSQL Admin Connection (for migrations and setup)
# Replace YOUR_ADMIN_PASSWORD_HERE with the password you set above
PG_ADMIN_URL=postgres://MatiasUCD:YOUR_ADMIN_PASSWORD_HERE@localhost:5432/postgres

# Application Database Credentials
DATABASE_USERNAME=TaxiDriver
DATABASE_PASSWORD=group6UCD
DATABASE_NAME=TaxiAPP

# Application Database URL (used by Sequelize)
DATABASE_URL=postgres://TaxiDriver:group6UCD@localhost:5432/TaxiAPP

# Application Configuration
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

**Important:** Replace `YOUR_ADMIN_PASSWORD_HERE` with a secure password and update `your_jwt_secret_here` with a strong secret key.

### 2. Install Dependencies

```bash
# Install npm packages
npm install

# or using yarn
yarn install
```

### 3. Run Database Migrations

```bash
# Run migrations to create tables
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Database Management

### Connecting to the Database

```bash
# Connect as superuser
psql -U MatiasUCD -d postgres

# Connect to application database
psql -U TaxiDriver -d TaxiAPP
```

### Common PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to TaxiAPP database
\c TaxiAPP

-- List all tables
\dt

-- Describe a table structure
\d table_name

-- Query data
SELECT * FROM table_name LIMIT 10;

-- Exit PostgreSQL
\q
```

## Troubleshooting

### Common Issues

1. **PostgreSQL connection refused**
   - Ensure PostgreSQL service is running
   - Check if PostgreSQL is listening on the correct port (default: 5432)

2. **Authentication failed**
   - Verify credentials in `.env` file
   - Ensure database users were created successfully

3. **Database does not exist**
   - Run the database creation SQL commands again
   - Check for typos in database name

### Verification Steps

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Test database connection:
   ```bash
   psql -U TaxiDriver -d TaxiAPP -c "SELECT 1;"
   ```

3. Verify environment variables:
   ```bash
   npm run check:env
   ```
