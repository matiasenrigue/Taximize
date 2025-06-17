import request from 'supertest';
import { sequelize } from '../../../config/db';
import app from '../../../app';
import User from '../../../models/userModel';
import Shift from '../../../models/shiftModel';
import ShiftSignal from '../../../models/shiftSignalModel';
import ShiftPause from '../../../models/shiftPauseModel';
import { generateAccessToken } from '../../../utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Helper function to create authenticated user and get token
async function createAuthenticatedUser(email: string = 'driver@test.com', username: string = 'testdriver') {
  const user = await User.create({
    email,
    username,
    password: 'password123'
  });
  const token = generateAccessToken(user.id);
  return { user, token };
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await User.destroy({ where: {} });
  await Shift.destroy({ where: {} });
  await ShiftSignal.destroy({ where: {} });
  await ShiftPause.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Shift API Integration Tests', () => {

  describe('POST /api/shifts/signal', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/shifts/signal returns 401 when no authentication provided
      const requestBody = {
        signal: 'start',
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/signal')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated but invalid signal provided', async () => {
      // Test authenticated user gets validation error for invalid signal
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        signal: 'invalid-signal',
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/signal')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid signal type');
    });

    it('should return 400 when authenticated but missing signal', async () => {
      // Test authenticated user gets validation error for missing signal
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        timestamp: Date.now()
        // Missing signal
      };

      const res = await request(app)
        .post('/api/shifts/signal')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Signal is required');
    });
  });

  describe('POST /api/shifts/start-shift', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/shifts/start-shift returns 401 when no authentication provided
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/start-shift')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 200 when authenticated driver starts first shift', async () => {
      // Test authenticated driver can successfully start first shift
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/start-shift')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successfully');
    });
  });

  describe('POST /api/shifts/pause-shift', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/shifts/pause-shift returns 401 when no authentication provided
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/pause-shift')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no active shift', async () => {
      // Test authenticated driver cannot pause non-existent shift
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/pause-shift')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active shift');
    });
  });

  describe('POST /api/shifts/continue-shift', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/shifts/continue-shift returns 401 when no authentication provided
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/continue-shift')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no paused shift', async () => {
      // Test authenticated driver cannot continue non-paused shift
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/continue-shift')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No paused shift');
    });
  });

  describe('POST /api/shifts/end-shift', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/shifts/end-shift returns 401 when no authentication provided
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/end-shift')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no active shift', async () => {
      // Test authenticated driver cannot end non-existent shift
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/end-shift')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active shift');
    });
  });

  describe('GET /api/shifts/current', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test GET /api/shifts/current returns 401 when no authentication provided
      const res = await request(app)
        .get('/api/shifts/current');
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 200 with no shift status when authenticated driver has no shift', async () => {
      // Test authenticated driver with no shift gets appropriate response
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/shifts/current')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isOnShift).toBe(false);
    });
  });
}); 