# Environment Variables Documentation

This document describes all environment variables required for the backend application.

## Database Configuration

### PG_ADMIN_URL
- **Type**: `string`
- **Description**: PostgreSQL superuser connection string for database creation scripts
- **Example**: `postgres://username:password@localhost:port/postgres`
- **Production**: `postgres://username:password@db_host:port/postgres`
- **Note**: Default PostgreSQL port is 5432
- **Required**: Yes (for database setup)

### DATABASE_URL
- **Type**: `string`
- **Description**: Application database connection string used by Sequelize
- **Example**: `postgres://db_user:db_password@localhost:port/database_name`
- **Production**: `postgres://db_user:db_password@db_host:port/database_name`
- **Note**: Default PostgreSQL port is 5432
- **Required**: Yes
- **Used in**: `src/shared/config/db.ts:13`

### DATABASE_USERNAME
- **Type**: `string`
- **Description**: Database user for the application
- **Example**: `db_user`
- **Required**: Yes

### DATABASE_PASSWORD
- **Type**: `string`
- **Description**: Database password for the application user
- **Example**: `strong_password_here`
- **Required**: Yes

### DATABASE_NAME
- **Type**: `string`
- **Description**: Name of the application database
- **Example**: `my_app_database`
- **Required**: Yes

## Server Configuration

### PORT
- **Type**: `number`
- **Description**: Port number for the backend server
- **Default**: `5000`
- **Example**: `5000`
- **Required**: No (defaults to 5000)
- **Used in**: `src/server.ts:9`

### NODE_ENV
- **Type**: `string`
- **Description**: Application environment
- **Values**: `development`, `production`, `test`
- **Example**: `production`
- **Required**: Yes
- **Used in**: 
  - `src/shared/config/db.ts:7-8`
  - `src/shared/middleware/error.middleware.ts:12-13`
  - `src/entities/auth/auth.controller.ts:69`

## Authentication & Security

### ACCESS_TOKEN_SECRET
- **Type**: `string`
- **Description**: Secret key for signing JWT access tokens
- **Example**: `your_64_character_hex_string_here`
- **Required**: Yes
- **Security**: Must be a strong, random string
- **Used in**: 
  - `src/entities/auth/utils/generateTokens.ts:4`
  - `src/shared/middleware/auth.middleware.ts:20`

### REFRESH_TOKEN_SECRET
- **Type**: `string`
- **Description**: Secret key for signing JWT refresh tokens
- **Example**: `another_64_character_hex_string_here`
- **Required**: Yes
- **Security**: Must be a strong, random string different from ACCESS_TOKEN_SECRET
- **Used in**: 
  - `src/entities/auth/utils/generateTokens.ts:10`
  - `src/entities/auth/auth.controller.ts:100`


## External Services

### CLIENT_URL
- **Type**: `string`
- **Description**: Frontend application URL for CORS configuration
- **Default**: `http://localhost:3000`
- **Example**: `http://localhost:3000`
- **Production**: `http://your-production-domain.com`
- **Required**: No (has default)
- **Used in**: `src/app.ts:31`

### DATA_API_URL
- **Type**: `string`
- **Description**: URL for the ML/Data API service
- **Default**: `http://localhost:5050`
- **Example**: `http://localhost:ml_api_port`
- **Production**: `http://ml-api-service:ml_api_port`
- **Note**: Replace ml-api-service with your ML API service name/host
- **Required**: No (has default)
- **Used in**: `src/shared/utils/dataApiClient.ts:3`

## Environment File Examples

### Development (.env)
```env
# Database Configuration
PG_ADMIN_URL=postgres://username:password@localhost:5432/postgres  # Default PostgreSQL port
DATABASE_USERNAME=db_user
DATABASE_PASSWORD=strong_password_here
DATABASE_NAME=my_app_database
DATABASE_URL=postgres://db_user:strong_password_here@localhost:5432/my_app_database  # Default PostgreSQL port

# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
ACCESS_TOKEN_SECRET=your_generated_access_token_secret_here
REFRESH_TOKEN_SECRET=your_generated_refresh_token_secret_here

# External Services
CLIENT_URL=http://localhost:3000
DATA_API_URL=http://localhost:5050  # Replace with your ML API port
```

### Production (.env.production)
```env
# Database Configuration
PG_ADMIN_URL=postgres://username:password@db_host:5432/postgres  # Replace db_host with your database host
DATABASE_USERNAME=db_user
DATABASE_PASSWORD=strong_password_here
DATABASE_NAME=my_app_database
DATABASE_URL=postgres://db_user:strong_password_here@db_host:5432/my_app_database  # Replace db_host

# Server Configuration
PORT=5000
NODE_ENV=production

# Authentication
ACCESS_TOKEN_SECRET=your_production_access_token_secret_here
REFRESH_TOKEN_SECRET=your_production_refresh_token_secret_here

# External Services
CLIENT_URL=http://your-production-domain.com
DATA_API_URL=http://ml-api-service:5050  # Replace with your ML API service name and port
```


## Generating Secure Secrets

To generate secure secret keys, you can use:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```