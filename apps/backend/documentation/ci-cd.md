# 🔄 CI/CD Implementation

## Overview

We implemented a robust CI/CD pipeline using GitHub Actions to automate testing and deployment of the TaxiApp monorepo project.

Current implementation provides:
- Automated testing on all code changes
- Safe deployment with test gates
- Zero-downtime deployment
- Automated cleanup of old docker images

## Pipeline Architecture

### Dual Workflow Strategy

1. **Continuous Integration** (`test.yml`)
   - Triggers: All branches, all PRs
   - Purpose: Early feedback, quality gates
   - Parallel jobs for backend and frontend

2. **Continuous Deployment** (`deploy-v2.yml`)
   - Triggers: Main branch, deployment branches
   - Purpose: Automated production deployment
   - Sequential: Test → Deploy

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

### Deployment Script Integration

The CI/CD pipeline executes `deploy-v2.sh` which:
1. Uses password from environment for sudo
2. Rebuilds all Docker containers
3. Handles database initialization
4. Performs health checks
5. Cleans up old images
