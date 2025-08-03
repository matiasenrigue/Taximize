# CI/CD Pipeline

Our comprehensive CI/CD implementation uses GitHub Actions to automate testing, ensure code quality, and provide reliable deployment with zero downtime.

## 🎯 Overview

We implemented a robust CI/CD pipeline using GitHub Actions that provides:
- **🧪 Automated Testing**: Comprehensive testing on all code changes
- **🛡️ Quality Gates**: Safe deployment with mandatory test validation
- **🚀 Zero-Downtime Deployment**: Seamless production updates
- **🧹 Resource Management**: Automated cleanup of old Docker images

## 🏗️ Pipeline Architecture

### 📊 **Workflow Flow**

```
Developer Push
    ├─→ test.yml (always runs)
    │      ├─→ Backend Tests
    │      └─→ Frontend Tests
    │
    └─→ deploy-v2.yml (specific branches)
           ├─→ Test Job
           │     ├─→ Install Dependencies
           │     ├─→ Build Backend
           │     ├─→ Build Frontend
           │     ├─→ Run Backend Tests
           │     └─→ Run Frontend Tests
           │
           └─→ Deploy Job (only if tests pass)
                 ├─→ SSH to Server
                 ├─→ Git Pull
                 └─→ Execute deploy-v2.sh
```

### ⚡ **Dual Workflow Strategy**

#### 🔄 **1. Continuous Integration** (`test.yml`)
- **🎯 Triggers**: All branches for comprehensive validation
- **📋 Purpose**: Early feedback and quality gates
- **⚡ Execution**: Parallel jobs for backend and frontend optimization

#### 🚀 **2. Continuous Deployment** (`deploy-v2.yml`)
- **🎯 Triggers**: Main branch for production deployment
- **📋 Purpose**: Automated, reliable production deployment
- **🔄 Execution**: Sequential flow - Test → Deploy for safety

## 🔧 Deployment Script Integration

### 📜 **Deploy Script Execution** (`deploy-v2.sh`)

The CI/CD pipeline executes our deployment script which handles:

1. **🔐 Authentication**: Uses environment password for secure sudo access
2. **🐳 Container Management**: Rebuilds all Docker containers with latest code
3. **💾 Database Setup**: Handles database initialization and migrations
4. **🩺 Health Validation**: Performs comprehensive health checks post-deployment
5. **🧹 Cleanup**: Automated removal of old Docker images for resource optimization
