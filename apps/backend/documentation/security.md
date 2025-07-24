# Security

## Authentication

### JWT Implementation
- **Access Token**: 15 minutes expiry, stored in client memory
- **Refresh Token**: 7 days expiry, HTTP-only cookie
- **Secrets**: `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` environment variables

### Password Security
- **Hashing**: Bcrypt with salt (10 rounds)
- **Storage**: Only hashed passwords stored
- **Validation**: Minimum 8 characters required

## Authorization

### Middleware
- **protect**: Validates JWT tokens from Authorization header
- **requireDriver**: Ensures user has driver permissions

## Input Validation

### Sequelize Validators
- Email format validation
- Username minimum 3 characters
- Password minimum 8 characters
- Coordinate validation for location data

### Sanitization
- Username escaping for XSS prevention
- Email normalization
- Type checking for numeric inputs

## API Security

### Rate Limiting
- 100 requests per 15 minutes per IP
- DDoS protection via express-rate-limit

### Security Headers (Helmet.js)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

### CORS
- Configured for frontend URL
- Credentials enabled

## Database Security

### SQL Injection Prevention
- Sequelize ORM with parameterized queries
- UUID v4 for unpredictable IDs
- Foreign key constraints