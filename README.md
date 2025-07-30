# Taxi Driver App

> **Disclaimer**: AI has been used to generate `.md` documentation files

A comprehensive full-stack application designed for taxi drivers to efficiently manage their shifts, rides, and earnings. Built with modern technologies and optimized for real-world taxi operations in NYC.

## 🚀 Features

- **🔐 Secure Authentication**: JWT-based authentication with access/refresh tokens
- **📊 Shift Management**: Track work sessions with GPS location, breaks, and earnings
- **🚖 Ride Tracking**: ML-powered ride evaluation with automatic scoring (1-5 rating)
- **🗺️ NYC Zone Integration**: Accurate zone detection using official NYC taxi zone boundaries
- **📈 Analytics Dashboard**: Visualize earnings, ride patterns, and performance metrics
- **🌐 Multi-language Support**: Internationalization ready with next-intl
- **📱 Responsive Design**: Mobile-first approach for on-the-go usage

## 🛠️ Tech Stack
 
### Frontend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Maps**: Google Maps API integration
- **Charts**: Recharts for data visualization
- **State Management**: React Hooks
- **Internationalization**: next-intl

### Backend
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis for performance optimization
- **Authentication**: JWT with bcrypt
- **Testing**: Jest & Supertest
- **Security**: Helmet.js, CORS, rate limiting

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Package Management**: npm workspaces (monorepo)

## Project Structure
```
├── market_research/                 #research for the report outside of lit review
|   ├── Diksha -Forms to Look into        #Research looking through various forums and Persona Profiles
|   ├── Ellie - Competitor Analysis       #Research into different ride hailing apps
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   ├── jest.config.js      # testing configuration
│   │   ├── package.json
│   │   └── tsconfig.json       # backend typescript configuration
│   └── frontend/
│       ├── __mocks__/          # testing - mocks to replace css-modules and files
│       ├── app/                # app & pages
│       ├── components/         # reusable components
│       ├── dictionaries/       # multi-language - texts
│       ├── hooks/              # custom hooks
│       ├── i18n/               # multi-language - next-intl setup
│       ├── public/             # static assets
│       ├── .npmrc
│       ├── .swcrc              # testing - SWC configuration (SWC compiles .tsx and .jsx to .js)
│       ├── jest.config.ts      # testing configuration
│       ├── jest.setup.ts       # testing - setup environment
│       ├── middleware.ts       # multi-language - rerouting
│       ├── next.config.ts
│       ├── next.env.d.ts
│       ├── package.json
│       └── tsconfig.json       # frontend typescript configuration
├── Data/
│   ├── cleaning_exploration/       # EDA, notebooks, exploratory analysis
│   │   └── zone_coordinates.csv    # Load zone → borough map (used for encoding)
│   └── data_models_api/
│       ├── combined_flask/         # Used for Integration
│       ├── scoring_model/          # Scoring logic and model assets
│       └── hotspot_model/          # Hotspot logic and model assets
├── node_modules/               # shared modules, do not commit!
├── packages/
│   └── shared/                 # shared code
├── .gitignore
├── .npmrc
├── eslint.config.mjs
├── package.json                # workspace configuration
├── package-lock.json
├── README.md
└── tsconfig.base.json          # base typescript configuration
```

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 7+ (optional, for caching)
- Docker and Docker Compose (optional, for containerized setup)
- Google Maps API key (for frontend map features)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd taxi-driver-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create `.env` files in both frontend and backend directories:

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL=postgresql://username:password@localhost:5432/taxi_driver_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret
PORT=3001
NODE_ENV=development
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Database Setup
```bash
# Create database
createdb taxi_driver_db

# Run migrations (from backend directory)
cd apps/backend
npm run migrate

# Seed database (optional)
npm run seed
```

### 5. Development

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run individually:
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run tests for specific workspace:
```bash
# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend
```

## 📦 Package Management

**Always** install packages for a specific workspace:
```bash
# Frontend packages
npm install <package> --workspace=apps/frontend

# Backend packages
npm install <package> --workspace=apps/backend

# Shared packages
npm install <package> --workspace=packages/shared
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/signout` - Logout user

### Shift Management
- `POST /shifts/start` - Start a new shift
- `POST /shifts/pause` - Pause current shift
- `POST /shifts/continue` - Continue paused shift
- `POST /shifts/end` - End current shift
- `GET /shifts/current` - Get current shift status
- `GET /shifts/:id` - Get shift details

### Ride Operations
- `POST /rides/evaluate` - ML-powered ride evaluation
- `POST /rides/start` - Start a new ride
- `POST /rides/end` - End current ride
- `GET /rides/:id` - Get ride details

### Zone Management
- `GET /zones` - Get all NYC taxi zones
- `GET /zones/:id` - Get specific zone details
- `POST /zones/lookup` - Find zone by coordinates

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down
```

### Individual Docker Builds

**Backend**:
```bash
cd apps/backend
docker build -t taxi-backend .
docker run -p 3001:3001 --env-file .env taxi-backend
```

**Frontend**:
```bash
cd apps/frontend
docker build -t taxi-frontend .
docker run -p 3000:3000 --env-file .env.local taxi-frontend
```

## 🚀 Production Deployment

### Environment Variables
Ensure all production environment variables are properly set:
- Use strong, unique JWT secrets
- Configure production database credentials
- Set `NODE_ENV=production`
- Configure CORS for your domain

### Database Migrations
```bash
# Run migrations in production
NODE_ENV=production npm run migrate --workspace=apps/backend
```

### Security Checklist
- ✅ HTTPS enabled
- ✅ Environment variables secured
- ✅ Database credentials protected
- ✅ Rate limiting configured
- ✅ CORS properly configured
- ✅ JWT secrets rotated regularly

## 📊 Database Schema

### Core Tables
- **users** - User authentication and profiles
- **shifts** - Work session tracking
- **rides** - Individual trip records
- **shift_signals** - State transitions
- **shift_pauses** - Break time tracking
- **hotspots** - Zone data storage

## 🗂️ Project Resources

- 📑 [Record Keeping Sheet](https://drive.google.com/drive/folders/1j7uh8_LCfJmR-18U4RQFO6gStkrbBFKN?usp=sharing) – Track sprint notes, deliverables, and testing logs  
- 🧠 [Notion Project Management](https://www.notion.so/Summer-Project-1fa9a3dee3a28095b1c6f3fbccc0ba68) – Tasks, timelines, and collaboration board
