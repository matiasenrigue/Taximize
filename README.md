# TaxiMize App

> **Disclaimer**: AI has been used to generate and improve `.md` documentation files under human supervision

A comprehensive full-stack application designed for taxi drivers to efficiently manage their shifts, rides, and earnings. Built with modern technologies and optimized for real-world taxi operations in NYC.

## 📹 Video Demo

[![Watch the Demo](https://img.shields.io/badge/▶️_Watch_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/eccbbC6lNtw?si=tFIqfrkAXYZm0xKZ)

> See the Taxi Driver App in action with a comprehensive walkthrough of all features and functionalities.

## 🚀 Features

### 🎯 **Smart Hotspots**
AI-powered passenger demand forecasting based on temporal and spatial patterns. The darker zones indicate higher probability of finding passengers, helping drivers optimize their positioning for maximum efficiency.

<img src="apps/backend/documentation/media/Hotspots.gif" alt="Hotspots Demo" width="250"/>

### ⭐ **Intelligent Ride Prediction**
ML-powered ride evaluation system that estimates the economic value of each ride before acceptance. Get instant scoring from 1-5 stars to make informed decisions about which rides to accept.

<table>
<tr>
<td><img src="apps/backend/documentation/media/3_stars_ride.gif" alt="3 Star Ride" width="250"/></td>
<td><img src="apps/backend/documentation/media/5_stars_ride.gif" alt="5 Star Ride" width="250"/></td>
</tr>
</table>

### 📊 **Analytics Dashboard**
Comprehensive statistics tracking your working vs idle time and detailed earnings analytics. View your performance metrics on weekly or monthly basis to optimize your driving strategy.

<img src="apps/backend/documentation/media/stats.gif" alt="Analytics Dashboard" width="250"/>

### 🔄 **Persistent State Management**
Seamless app experience with full state persistence. Exit and return to the app without losing progress - counters, timers, and current page state are perfectly maintained across sessions.

> 🔍 **Notice**: Watch how page reloads maintain exact state - timers continue running and current page stays unchanged!

<table>
<tr>
<td><img src="apps/backend/documentation/media/reload-breaks.gif" alt="Break State Persistence" width="250"/></td>
<td><img src="apps/backend/documentation/media/reload-ride.gif" alt="Ride State Persistence" width="250"/></td>
</tr>
</table>

### ⚙️ **Customizable Preferences**
Personalize your experience with:
- 🌙 **Dark/Light Mode** - Choose your preferred theme
- 🌍 **Multi-language Support** - Currently available in English and German
- ⏰ **Safety Notifications** - Configure automatic break reminders (every 3 hours for driver safety)

<img src="apps/backend/documentation/media/preferences.gif" alt="Preferences Demo" width="250"/>


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

---

## 📚 **Detailed project structure:**
- [Frontend Structure →](./apps/frontend/README.md)
- [Backend Architecture →](./apps/backend/README.md)
- [Data Science Structure →](./data/README.md)


## 🛠️ Tech Stack Overview

- **Frontend**: Next.js 15 with React 19, TypeScript, Google Maps integration
- **Backend**: Express.js 5, PostgreSQL, Redis, JWT authentication
- **Data Models**: Python, Flask API, XGBoost/LightGBM models
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD

[Learn more about our CI/CD setup →](./apps/backend/documentation/ci-cd.md)


## 📁 Project Structure

```
├── apps/
│   ├── frontend/               # Next.js frontend application
│   └── backend/                # Express.js backend API

├── data/                       # Data science & ML models

├── market_research/            # User research & competitor analysis

├── packages/
│   └── shared/                 # Shared code between apps

└── README.md                   # This file
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
git clone https://github.com/matiasenrigue/Taximize
cd Taximize
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create environment files for each application:

- **Backend**: Create `apps/backend/.env` ([see Backend environment variables →](./apps/backend/documentation/environment_vars.md))
- **Frontend**: Create `apps/frontend/.env.local` ([see Frontend setup →](./apps/frontend/README.md#environment-variables))
- **Data API**: No additional env setup required

### 4. Database Setup

[See Database Installation Guide →](./apps/backend/documentation/InstallationInstructions.md#database-setup)

### 5. Development

**Development setup for each component:**
- [Frontend Development →](./apps/frontend/README.md#development-commands)
- [Backend Development →](./apps/backend/README.md#-scripts)
- [Data API Development →](./data/README.md#local-development)


## 🧪 Testing

**Testing documentation:**
- [Frontend Testing →](./apps/frontend/README.md#running-tests)
- [Backend Testing →](./apps/backend/documentation/testing.md)


## 📚 API Documentation

### Backend API Routes
- [Authentication API →](./apps/backend/documentation/API_Documentation/auth.md)
- [Users API →](./apps/backend/documentation/API_Documentation/users.md)
- [Shifts API →](./apps/backend/documentation/API_Documentation/shifts.md)
- [Rides API →](./apps/backend/documentation/API_Documentation/rides.md)
- [Hotspots API →](./apps/backend/documentation/API_Documentation/hotspots.md)
- [Stats API →](./apps/backend/documentation/API_Documentation/stats.md)

### Data Science API Routes
- [ML Model APIs →](./data/README.md#api-endpoints)
- [Trip Scoring Endpoints →](./data/README.md#trip-scoring-endpoints)
- [Hotspot Prediction →](./data/README.md#hotspot-prediction-endpoint)


## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services (including nginx, database, redis)
docker-compose -f docker-compose.nginx.yml up --build

# Run in detached mode
docker-compose -f docker-compose.nginx.yml up -d

# Stop all services
docker-compose -f docker-compose.nginx.yml down
```

**Note**: The docker-compose file includes:
- Nginx reverse proxy (port 80)
- PostgreSQL database
- Redis cache
- Backend API
- Frontend application
- ML/Data API service

## 📊 Additional Resources

### Database & Architecture
- [Database Schema →](./apps/backend/documentation/database.md)
- [Entity Relationships →](./apps/backend/src/entities/README.md)
- [Security Guidelines →](./apps/backend/documentation/security.md)
- [Performance Analysis →](./apps/backend/documentation/performance.md)

### Development Resources
- [Backend Installation →](./apps/backend/documentation/InstallationInstructions.md)
- [Testing Strategy →](./apps/backend/documentation/testing.md)
- [Environment Variables →](./apps/backend/documentation/environment_vars.md)
- [CI/CD Pipeline →](./apps/backend/documentation/ci-cd.md)
- [Backend Overview →](./apps/backend/documentation/README.md)
- [API Documentation Index →](./apps/backend/documentation/API_Documentation/README.md)


## 🗂️ Project Resources

- 📑 [Record Keeping Sheet](https://drive.google.com/drive/folders/1j7uh8_LCfJmR-18U4RQFO6gStkrbBFKN?usp=sharing) – Track sprint notes, deliverables, and testing logs  
- 🧠 [Notion Project Management](https://www.notion.so/Summer-Project-1fa9a3dee3a28095b1c6f3fbccc0ba68) – Tasks, timelines, and collaboration board
