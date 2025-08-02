# Shared Utils

Core utility functions that provide essential transformations, API communications, and standardized response formatting across the backend application.

## 🔧 Components

1. **Case Transformer** (`caseTransformer.ts`)
   - Handles conversion between database snake_case and JavaScript camelCase
   - Provides `modelToResponse()` and `requestToModel()` for seamless API/DB transformations

2. **Data API Client** (`dataApiClient.ts`)
   - Manages communication with external prediction service
   - Fetches hotspot predictions and scores trips using XGBoost model

3. **Response Handler** (`responseHandler.ts`)
   - Standardizes all API responses with consistent structure
   - Automatically maps errors to appropriate HTTP status codes
