# 🚀 Backend API

A high-performance Node.js/TypeScript backend built with Express.js following entity-based architecture patterns.

## 📚 Documentation Index

### 🏗️ Entity Documentation
- **[🔗 Entity Interactions](./src/entities/README.md)** - How entities work together
- **[🔐 Auth Module](./src/entities/auth/README.md)** - Authentication implementation
- **[👤 Users Module](./src/entities/users/README.md)** - User management
- **[🗺️ Hotspots Module](./src/entities/hotspots/README.md)** - Hotspot logic
- **[🚙 Rides Module](./src/entities/rides/README.md)** - Ride management
- **[📅 Shifts Module](./src/entities/shifts/README.md)** - Shift handling
- **[⏸️ Shift Pauses Module](./src/entities/shift-pauses/README.md)** - Break management
- **[📶 Shift Signals Module](./src/entities/shift-signals/README.md)** - Signal validation
- **[📈 Stats Module](./src/entities/stats/README.md)** - Statistics processing

### 🎯 Core Documentation
- **[📖 Backend Documentation Hub](./documentation/README.md)** - Main documentation entry point
- **[🚀 Installation Instructions](./documentation/InstallationInstructions.md)** - Step-by-step setup guide
- **[🗄️ Database Schema](./documentation/database.md)** - Database structure and relationships
- **[⚙️ Environment Variables](./documentation/environment_vars.md)** - Configuration guide
- **[🔒 Security Guidelines](./documentation/security.md)** - Security implementation and best practices
- **[🧪 Testing Strategy](./documentation/testing.md)** - TDD methodology and test coverage
- **[⚡ Performance Analysis](./documentation/performance.md)** - Performance optimization strategies
- **[🔄 CI/CD Pipeline](./documentation/ci-cd.md)** - Continuous integration and deployment

### 📡 API Documentation
- **[🔑 Auth API](./documentation/API_Documentation/auth.md)** - Authentication endpoints
- **[👥 Users API](./documentation/API_Documentation/users.md)** - User management endpoints
- **[📍 Hotspots API](./documentation/API_Documentation/hotspots.md)** - Hotspot management
- **[🚗 Rides API](./documentation/API_Documentation/rides.md)** - Ride tracking endpoints
- **[⏰ Shifts API](./documentation/API_Documentation/shifts.md)** - Shift management
- **[📊 Stats API](./documentation/API_Documentation/stats.md)** - Analytics endpoints


## 💻 Tech Stack

- **🏃 Runtime**: Node.js 18+ with TypeScript
- **🌐 Framework**: Express.js v5
- **🗄️ Database**: PostgreSQL/SQLite with Sequelize ORM
- **⚡ Cache**: Redis for performance optimization
- **🔑 Authentication**: JWT tokens with refresh mechanism
- **🧪 Testing**: Jest with TDD approach

## 🏛️ Architecture

### Entity-Based Design

The codebase follows a modular entity-based architecture where each business domain is encapsulated in its own module:

```
src/entities/
├── 🚗 rides/
├── ⏰ shifts/
├── 👥 users/
├── 🔐 auth/
├── ⏸️ shift-pauses/
├── 📶 shift-signals/
├── 📊 stats/
└── 📍 hotspots/
```

### 📁 Entity Structure Pattern

Each entity follows a consistent layered structure:

```
entities/[entity-name]/
├── 📝 [entity].types.ts       # TypeScript interfaces
├── 📋 [entity].constants.ts   # Error messages, enums
├── 🗃️ [entity].model.ts       # Sequelize model definition
├── 🔍 [entity].repository.ts  # Data access layer
├── 💼 [entity].service.ts     # Business logic layer
├── 🎮 [entity].controller.ts  # HTTP request handlers
├── 🛣️ [entity].routes.ts      # Express route definitions
└── 🧪 tests/                  # Unit & integration tests
```


## 📜 Scripts

```bash
npm run build       # 🔨 Compile TypeScript
npm start           # 🚀 Start production server
npm test            # 🧪 Run tests
npm run create-db   # 🗄️ Initialize database
npm run sync-db     # 🔄 Sync database models
```
