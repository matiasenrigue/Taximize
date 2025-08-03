# 🚀 API Documentation

## 🌐 Base URL
```
https://your-domain.com/api
```

## 🔑 Authentication
Most endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

## 📚 API Endpoints

### 🔐 [Authentication](./auth.md) `/api/auth`
User registration, login, and token management

| Endpoint | Description |
|----------|-------------|
| `POST /signup` | Register new user |
| `POST /signin` | Login & get tokens |
| `POST /refresh` | Refresh access token |

### 👤 [Users](./users.md) `/api/users`
Profile and preferences management

| Endpoint | Description |
|----------|-------------|
| `GET /me` | Get user profile |
| `GET /preferences` | Get preferences |
| `PUT /preferences` | Update preferences |

### ⏰ [Shifts](./shifts.md) `/api/shifts`
Work shift tracking and management

| Endpoint | Description |
|----------|-------------|
| `POST /start-shift` | Begin work |
| `POST /pause-shift` | Take break |
| `POST /continue-shift` | Resume work |
| `POST /end-shift` | Complete shift |
| `POST /skip-pause` | Reset break timer |
| `GET /current` | Current status |
| `GET /debug` | Debug info |
| `GET /` | All shifts |

### 🚖 [Rides](./rides.md) `/api/rides`
Individual ride tracking with ML scoring

| Endpoint | Description |
|----------|-------------|
| `POST /evaluate-ride` | Get ML score |
| `POST /start-ride` | Begin ride |
| `GET /current` | Active ride info |
| `POST /end-ride` | Complete & calculate fare |

### 🔥 [Hotspots](./hotspots.md) `/api/hotspots`
ML-powered demand predictions

| Endpoint | Description |
|----------|-------------|
| `GET /` | Get high-demand zones |

### 📊 [Statistics](./stats.md) `/api/stats`
Analytics and performance tracking

| Endpoint | Description |
|----------|-------------|
| `GET /shifts-by-days` | Recent shift history |
| `GET /rides-by-weekday` | Weekly patterns |
| `GET /earnings` | Earnings breakdown |
| `GET /worktime` | Time analysis |