# Backend API

A Node.js/TypeScript backend built with Express.js following entity-based architecture patterns.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: PostgreSQL/SQLite with Sequelize ORM
- **Cache**: Redis for performance optimization
- **Authentication**: JWT tokens
- **Testing**: Jest with TDD approach
- **Additional**: ML service integration, WebSocket support

## Architecture

### Entity-Based Design

The codebase is organized around business entities, with each entity containing all its related logic in a single module:

```
src/entities/
├── rides/
├── shifts/
├── users/
├── auth/
├── pauses/
└── hotspots/
```

### Entity Structure Pattern

Using `rides` as the complete example, each entity follows this structure:

```
entities/rides/
├── ride.types.ts       # TypeScript interfaces
├── ride.constants.ts   # Error messages, enums
├── ride.model.ts       # Sequelize model definition
├── ride.repository.ts  # Data access layer
├── ride.service.ts     # Business logic layer
├── ride.mlService.ts   # ML integration (domain-specific)
├── ride.controller.ts  # HTTP request handlers
├── ride.routes.ts      # Express route definitions
└── tests/              # Unit & integration tests
```

### Layered Architecture

Each request flows through distinct layers:
- **Controller**: Handles HTTP requests/responses
- **Service**: Contains business logic and validation
- **Repository**: Abstracts database operations
- **Model**: Defines data structure and relationships

## Request Flow Example

Here's how `POST /api/rides/start` flows through the system:

### 1. Route Definition (ride.routes.ts)
```typescript
router.post('/start', authenticateDriver, startRideValidator, startRide);
```

### 2. Middleware Chain
- `authenticateDriver`: Verifies JWT token
- `startRideValidator`: Validates request body
- `startRide`: Controller function

### 3. Controller (ride.controller.ts)
```typescript
export const startRide = asyncHandler(async (req, res) => {
  const { shiftId } = req.body;
  const driverId = req.user!.id;
  
  const ride = await RideService.startRide(driverId, shiftId);
  
  res.status(201).json({
    success: true,
    data: transformToApiResponse(ride)
  });
});
```

### 4. Service (ride.service.ts)
```typescript
static async startRide(driverId: number, shiftId: number): Promise<Ride> {
  // Business logic: check if driver can start ride
  const canStart = await this.canStartRide(driverId, shiftId);
  if (!canStart) {
    throw new AppError('Cannot start ride', 400);
  }
  
  // Create ride through repository
  return RideRepository.create({
    driver_id: driverId,
    shift_id: shiftId,
    start_time: new Date()
  });
}
```

### 5. Repository (ride.repository.ts)
```typescript
static async create(data: CreateRideData): Promise<Ride> {
  return Ride.create(data);
}

// More complex example showing repository benefits:
static async findActiveByDriver(driverId: number): Promise<Ride | null> {
  return Ride.findOne({
    where: {
      driver_id: driverId,
      end_time: null
    },
    include: [{
      model: Shift,
      attributes: ['id', 'start_time', 'status']
    }],
    order: [['start_time', 'DESC']]
  });
}

// Repository encapsulates complex queries
static async getRidesWithMetrics(shiftId: number): Promise<Ride[]> {
  return Ride.findAll({
    where: { shift_id: shiftId },
    attributes: {
      include: [
        [Sequelize.literal('EXTRACT(EPOCH FROM (end_time - start_time))'), 'duration_seconds'],
        [Sequelize.literal('distance_km * 1000'), 'distance_meters']
      ]
    }
  });
}
```

## Key Patterns

### Soft Deletes
All models use Sequelize's paranoid option for soft deletes:
```typescript
@Table({ paranoid: true })
```

### Case Transformation
API uses camelCase while database uses snake_case:
- Request: `{ shiftId: 123 }` → DB: `{ shift_id: 123 }`
- Response: `{ start_time: "..." }` → API: `{ startTime: "..." }`

### Repository Pattern
Abstracts data access for better testability and maintainability:
```typescript
// Service layer uses repository methods, not Sequelize directly
const activeRide = await RideRepository.findActiveByDriver(driverId);

// Repository handles complex queries, making them reusable
const ridesWithMetrics = await RideRepository.getRidesWithMetrics(shiftId);

// Easy to mock in tests
jest.mock('../ride.repository');
RideRepository.findActiveByDriver.mockResolvedValue(mockRide);
```

### Error Handling
Centralized error middleware catches all errors:
```typescript
app.use(errorHandler); // Converts AppError to JSON response
```

## Security

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (driver, admin roles)
- Driver-specific middleware for protected routes

### Input Validation
- Request validation middleware using express-validator
- Sanitization of all user inputs
- Type checking with TypeScript interfaces

### Security Headers
- Helmet.js for security headers
- CORS configuration for allowed origins
- Rate limiting on API endpoints

### Data Protection
- Password hashing with bcrypt
- Environment variables for sensitive config
- SQL injection prevention via Sequelize ORM

## Testing

Built with Test-Driven Development (TDD) approach. Tests are written before implementation to ensure code quality and coverage.

### Test Structure
- **Unit tests**: Test individual services and utilities
- **Integration tests**: Test API endpoints end-to-end
- **Test utilities**: Shared helpers for test data

### Running Tests
```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:int      # Integration tests only
npm run test:watch    # Watch mode for TDD
```

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL or SQLite
- Redis (optional, for caching)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Development
```bash
# Start development server with hot reload
npm run dev

# Run linting
npm run lint

# Type checking
npm run typecheck
```

### Environment Variables
Key variables to configure:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string (optional, defaults to redis://localhost:6379)
- `JWT_SECRET`: Secret for JWT signing
- `ML_SERVICE_URL`: Machine learning service endpoint
- `NODE_ENV`: development | production | test