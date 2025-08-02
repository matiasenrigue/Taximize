# Security

This document outlines the comprehensive security measures implemented throughout the application to protect against common vulnerabilities and ensure data integrity.

## 🔐 Authentication

The application implements a robust JWT-based authentication system designed for security and user experience balance.

### 🎫 **JWT Implementation**
- **Access Token**: 15-minute expiry, stored in client memory for XSS protection
- **Refresh Token**: 7-day expiry, HTTP-only cookie for enhanced security
- **Secrets**: `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` environment variables
- **Strategy**: Dual-token approach minimizes exposure while maintaining usability

### 🔒 **Password Security**
- **Hashing Algorithm**: Bcrypt with salt for secure password storage
- **Storage Policy**: Only hashed passwords stored, plaintext never persisted


## 🛡️ Authorization

### 🔍 **Middleware Protection**
- **`protect` Middleware**: Validates JWT tokens from Authorization header
- **Route Protection**: Applied to all authenticated endpoints
- **Token Verification**: Ensures valid signatures and expiry times

## ✅ Input Validation

Comprehensive validation and sanitization prevents injection attacks and data corruption.

### 🧹 **Data Sanitization**
- **Username Escaping**: XSS prevention through proper character encoding
- **Email Normalization**: Consistent format and case handling
- **Type Validation**: Strict checking for numeric inputs and data types
- **Sequelize Validators**: Built-in ORM validation for data integrity

## 🌐 API Security

### ⏱️ **Rate Limiting**
- **Limit**: 100 requests per 15 minutes per IP address
- **Protection**: DDoS mitigation via `express-rate-limit`
- **Strategy**: Per-IP tracking prevents abuse while allowing legitimate usage

### 🛡️ **Security Headers (Helmet.js)**
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Stops MIME sniffing vulnerabilities
- **Strict-Transport-Security**: Enforces HTTPS connections
- **X-XSS-Protection**: Browser-level XSS filtering

### 🔄 **CORS Configuration**
- **Origin Control**: Configured for specific frontend URL
- **Credentials**: Enabled for authenticated requests
- **Method Restrictions**: Only necessary HTTP methods allowed

## 💾 Database Security

### 🚫 **SQL Injection Prevention**
- **ORM Protection**: Sequelize ORM with parameterized queries
- **UUID Implementation**: UUID v4 for unpredictable primary keys
- **Constraint Enforcement**: Foreign key constraints maintain referential integrity
- **Query Validation**: All database interactions through validated models