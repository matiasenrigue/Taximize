# Entities

This directory contains the core business entities and their associated logic for the backend application. Each entity is organized as a self-contained module with its own controllers, services, models, routes, and tests.

## Directory Structure

- **auth/** - Authentication and authorization logic
- **hotspots/** - Hotspot management for ride demand areas
- **rides/** - Ride lifecycle management and ML-powered features
- **shift-pauses/** - Break time tracking during shifts
- **shift-signals/** - Real-time shift event signaling
- **shifts/** - Work shift management and calculations
- **stats/** - Statistical analysis and reporting
- **users/** - User profile and account management

## Architecture Pattern

Each entity module follows a consistent architecture:
- `*.model.ts` - Database schemas and data models
- `*.controller.ts` - HTTP request handlers
- `*.service.ts` - Business logic layer
- `*.routes.ts` - API endpoint definitions
- `*.repository.ts` - Data access layer (where applicable)
- `tests/` - Unit and integration tests
- `utils/` - Entity-specific utilities

## Testing

All entities include comprehensive test coverage with both unit tests for individual components and integration tests for API endpoints and workflows.