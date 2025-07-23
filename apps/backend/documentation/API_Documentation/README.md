# API Documentation

## Overview

This directory contains comprehensive documentation for all backend API endpoints. The API is designed for a taxi driver management system that includes shift tracking, ride management, earnings analytics, and ML-powered features.

## Base URL

All API endpoints are prefixed with: `http://localhost:3000/api`

Production URL will be different and should be configured via environment variables.

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens). After successful login, include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## API Categories

### 1. [Authentication](./auth.md)
- **Base Path:** `/api/auth`
- **Purpose:** User registration, login, and token management
- **Key Endpoints:**
  - `POST /signup` - Register new user
  - `POST /signin` - Login and receive tokens
  - `POST /refresh` - Refresh access token

### 2. [Users](./users.md)
- **Base Path:** `/api/users`
- **Purpose:** User profile management
- **Key Endpoints:**
  - `GET /me` - Get current user profile

### 3. [Shifts](./shifts.md)
- **Base Path:** `/api/shifts`
- **Purpose:** Driver shift management
- **Key Endpoints:**
  - `POST /start-shift` - Start a new shift
  - `POST /pause-shift` - Pause active shift
  - `POST /continue-shift` - Resume paused shift
  - `POST /end-shift` - End active shift
  - `POST /skip-pause` - Skip break reminder
  - `GET /current` - Get current shift status
  - `GET /` - Get all shifts
  - `GET /debug` - Debug shift information

### 4. [Rides](./rides.md)
- **Base Path:** `/api/rides`
- **Purpose:** Individual ride tracking and management
- **Key Endpoints:**
  - `POST /evaluate-ride` - Get ML prediction for ride quality
  - `POST /start-ride` - Start a new ride
  - `GET /current` - Get current ride status
  - `POST /end-ride` - End ride with fare information

### 5. [Hotspots](./hotspots.md)
- **Base Path:** `/api/hotspots`
- **Purpose:** ML-powered taxi demand predictions
- **Key Endpoints:**
  - `GET /` - Get current hotspot predictions

### 6. [Statistics](./stats.md)
- **Base Path:** `/api/stats`
- **Purpose:** Analytics and reporting
- **Key Endpoints:**
  - `GET /shifts-by-days` - Shift history
  - `GET /rides-by-weekday` - Rides by day of week
  - `GET /earnings` - Earnings analytics
  - `GET /worktime` - Work time statistics
