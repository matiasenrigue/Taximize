# Taxi Driver App

> **Disclaimer**: AI has been used to generate `.md` documentation files

A comprehensive full-stack application designed for taxi drivers to efficiently manage their shifts, rides, and earnings. Built with modern technologies and optimized for real-world taxi operations in NYC.

## 📹 Video Demo

[![Watch the Demo](https://img.shields.io/badge/▶️_Watch_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/eccbbC6lNtw?si=tFIqfrkAXYZm0xKZ)

> See the Taxi Driver App in action with a comprehensive walkthrough of all features and functionalities.

## 🚀 Features

### 🎯 **Smart Hotspots**
AI-powered passenger demand forecasting based on temporal and spatial patterns. The darker zones indicate higher probability of finding passengers, helping drivers optimize their positioning for maximum efficiency.

<img src="apps/backend/documentation/media/Hotspots.gif" alt="Hotspots Demo" width="300"/>

### ⭐ **Intelligent Ride Prediction**
ML-powered ride evaluation system that estimates the economic value of each ride before acceptance. Get instant scoring from 1-5 stars to make informed decisions about which rides to accept.

<table>
<tr>
<td><img src="apps/backend/documentation/media/3_stars_ride.gif" alt="3 Star Ride" width="300"/></td>
<td><img src="apps/backend/documentation/media/5_stars_ride.gif" alt="5 Star Ride" width="300"/></td>
</tr>
</table>

### 📊 **Analytics Dashboard**
Comprehensive statistics tracking your working vs idle time and detailed earnings analytics. View your performance metrics on weekly or monthly basis to optimize your driving strategy.

<img src="apps/backend/documentation/media/stats.gif" alt="Analytics Dashboard" width="300"/>

### 🔄 **Persistent State Management**
Seamless app experience with full state persistence. Exit and return to the app without losing progress - counters, timers, and current page state are perfectly maintained across sessions.

> 🔍 **Notice**: Watch how page reloads maintain exact state - timers continue running and current page stays unchanged!

<table>
<tr>
<td><img src="apps/backend/documentation/media/reload-breaks.gif" alt="Break State Persistence" width="300"/></td>
<td><img src="apps/backend/documentation/media/reload-ride.gif" alt="Ride State Persistence" width="300"/></td>
</tr>
</table>

### ⚙️ **Customizable Preferences**
Personalize your experience with:
- 🌙 **Dark/Light Mode** - Choose your preferred theme
- 🌍 **Multi-language Support** - Currently available in English and German
- ⏰ **Safety Notifications** - Configure automatic break reminders (every 3 hours for driver safety)

<img src="apps/backend/documentation/media/preferences.gif" alt="Preferences Demo" width="300"/>


### 🕐 **Shift Starting Recommendation**
AI-powered recommendations on optimal shift timing to maximize profitability. Get instant visual feedback on whether it's the right time to start driving based on demand patterns and historical data.

> ⚠️ **Note**: This feature currently uses hardcoded hours as it was not part of the initial MVP - planned for future development.

<table>
<tr>
<td><img src="apps/backend/documentation/media/green.png" alt="Good Time to Start" width="200"/></td>
<td><img src="apps/backend/documentation/media/orange_hour.PNG" alt="Moderate Time" width="200"/></td>
<td><img src="apps/backend/documentation/media/red_hour.PNG" alt="Poor Time to Start" width="200"/></td>
</tr>
<tr>
<td align="center"><strong>🟢 Optimal Time</strong></td>
<td align="center"><strong>🟡 Moderate Time</strong></td>
<td align="center"><strong>🔴 Poor Time</strong></td>
</tr>
</table>


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
