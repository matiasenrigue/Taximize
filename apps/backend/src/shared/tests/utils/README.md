# Test Utils

Test helper utilities for backend testing.

## testHelpers.ts

Provides helper methods for:
- Setting up test environment variables
- Creating authenticated users with tokens
- Creating test data (shifts, rides)
- Database setup and cleanup

### Usage

```typescript
import { TestHelpers } from './testHelpers';

// Setup test environment
TestHelpers.setupEnvironment();

// Create test user
const { user, token } = await TestHelpers.createAuthenticatedUser();

// Cleanup after tests
await TestHelpers.cleanupDatabase();
```