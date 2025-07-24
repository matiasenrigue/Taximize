# Shared Utils

## Overview

This directory contains utility functions shared across the backend application. These utilities handle common transformations, API communications, and standardized response formatting.

## Utilities

### Case Transformer (`caseTransformer.ts`)

Handles bidirectional conversion between database snake_case and JavaScript camelCase conventions.

#### Key Functions

- **`snakeToCamel(str)`** - Converts snake_case strings to camelCase
- **`camelToSnake(str)`** - Converts camelCase strings to snake_case
- **`transformKeysSnakeToCamel(obj)`** - Recursively transforms object keys from snake_case to camelCase
- **`transformKeysCamelToSnake(obj)`** - Recursively transforms object keys from camelCase to snake_case
- **`modelToResponse(model)`** - Converts Sequelize models to camelCase response objects
- **`requestToModel(data)`** - Converts incoming camelCase requests to snake_case for database operations

#### Usage Example

```typescript
// API Response
const dbResult = {
  driver_id: '123',
  shift_start: '2024-01-01',
  is_active: true
};

const apiResponse = modelToResponse(dbResult);
// { driverId: '123', shiftStart: '2024-01-01', isActive: true }

// API Request
const request = { startLatitude: 53.349, endLongitude: -6.260 };
const dbData = requestToModel(request);
// { start_latitude: 53.349, end_longitude: -6.260 }
```

### Data API Client (`dataApiClient.ts`)

Manages communication with the external data prediction service for hotspot predictions and trip scoring.

#### Functions

- **`getHotspotPredictions(time?)`** - Fetches predicted high-demand areas
  - Returns sorted array of zones by predicted trip count
  - Optional time parameter (ISO 8601 format)
  
- **`scoreTripXGB(request)`** - Scores trips using XGBoost model
  - Requires pickup/dropoff zones and datetime
  - Returns predicted score and final weighted score

- **`formatDateTimeForScoring(date)`** - Formats dates for scoring API
  - Converts Date to "MM/DD/YYYY HH:MM:SS AM/PM" format

#### Configuration

Set `DATA_API_URL` environment variable (defaults to `http://localhost:5050`)

### Response Handler (`responseHandler.ts`)

Standardizes API responses across the application.

#### Methods

- **`ResponseHandler.success(res, data?, message?, statusCode?)`**
  - Sends successful responses with consistent structure
  - Automatically converts database models to camelCase
  - Default status: 200

- **`ResponseHandler.error(error, res, defaultMessage?)`**
  - Maps error messages to appropriate HTTP status codes
  - Status code mapping:
    - 403: "not authorized" / "unauthorized"
    - 404: "not found"
    - 409: "already exists" / "duplicate"
    - 400: Default for other errors

#### Response Format

```typescript
// Success
{
  success: true,
  message?: "Operation successful",
  data?: { /* camelCase data */ }
}

// Error (throws with appropriate status)
Error: "Specific error message"
```

## Integration

These utilities integrate seamlessly with:

- **Controllers**: Use ResponseHandler for consistent API responses
- **Services**: Use case transformers for database operations
- **External APIs**: Use dataApiClient for prediction services

