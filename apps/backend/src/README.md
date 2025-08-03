# 🚀 Backend Source Code

## 📚 Documentation Index

### ⭐ ESSENTIAL - Start Here
> **[🔗 Entity Interactions & System Architecture](./entities/README.md)**  
> **↑ MUST READ FIRST** - Comprehensive visual guide showing how all backend entities interact with each other through signals, validations, and database operations.

### 🏗️ Entity Documentation
- **[🔐 Auth Module](./entities/auth/README.md)** - Authentication implementation
- **[👤 Users Module](./entities/users/README.md)** - User management
- **[🗺️ Hotspots Module](./entities/hotspots/README.md)** - Hotspot logic
- **[🚙 Rides Module](./entities/rides/README.md)** - Ride management
- **[📅 Shifts Module](./entities/shifts/README.md)** - Shift handling
- **[⏸️ Shift Pauses Module](./entities/shift-pauses/README.md)** - Break management
- **[📶 Shift Signals Module](./entities/shift-signals/README.md)** - Signal validation
- **[📈 Stats Module](./entities/stats/README.md)** - Statistics processing

### 📡 API Documentation
- **[🔑 Auth API](../documentation/API_Documentation/auth.md)** - Authentication endpoints
- **[👥 Users API](../documentation/API_Documentation/users.md)** - User management endpoints
- **[📍 Hotspots API](../documentation/API_Documentation/hotspots.md)** - Hotspot management
- **[🚗 Rides API](../documentation/API_Documentation/rides.md)** - Ride tracking endpoints
- **[⏰ Shifts API](../documentation/API_Documentation/shifts.md)** - Shift management
- **[📊 Stats API](../documentation/API_Documentation/stats.md)** - Analytics endpoints

## 🏗️ Structure

```
src/
├── 📱 app.ts              # Express app configuration
├── 🖥️ server.ts           # Server entry point

├── 🏢 entities/           # Domain entities (feature modules)
    ├── 🔐 auth/           # Authentication and authorization
    ├── 📍 hotspots/       # Hotspot management
    ├── 🚗 rides/          # Ride tracking and management
    ├── ⏰ shifts/         # Driver shift management
    ├── ⏸️ shift-pauses/   # Pause tracking during shifts
    ├── 📶 shift-signals/  # Signal validation for shifts
    ├── 📊 stats/          # Statistics and analytics
    ├── 👥 users/          # User management

├── 🔧 shared/             # Shared utilities and configurations
│   ├── ⚙️ config/         # Database and app configuration
│   ├── 🛡️ middleware/     # Common middleware
│   ├── 📝 types/          # TypeScript type definitions
│   └── 🛠️ utils/          # Utility functions

└── 📄 README.md           # This file
```
