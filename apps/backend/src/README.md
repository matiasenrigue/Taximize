# Backend Source Code

## Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server entry point
├── entities/           # Domain entities (feature modules)
├── shared/             # Shared utilities and configurations
│   ├── config/         # Database and app configuration
│   ├── middleware/     # Common middleware
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
└── README.md           # This file
```

## Entities

- **auth/** - Authentication and authorization
- **hotspots/** - Hotspot management
- **rides/** - Ride tracking and management
- **shifts/** - Driver shift management
- **shift-pauses/** - Pause tracking during shifts
- **shift-signals/** - Signal validation for shifts
- **stats/** - Statistics and analytics
- **users/** - User management

## Scripts

```bash
npm run build       # Compile TypeScript
npm start           # Start production server
npm test            # Run tests
npm run create-db   # Initialize database
npm run sync-db     # Sync database models
```

## Tech Stack

- Express.js with TypeScript
- Sequelize ORM with PostgreSQL
- JWT authentication
- Jest for testing