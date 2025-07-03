import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import User from '../../../users/user.model';
import Ride from '../../ride.model';
import Shift from '../../../shifts/shift.model';
import ShiftSignal from '../../../shifts/shift-signal.model';
import { generateAccessToken } from '../../../auth/utils/generateTokens';

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
  initializeAssociations();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  // Clean up in correct order due to foreign key constraints
  // Use force: true to hard delete even with paranoid mode
  await Ride.destroy({ where: {}, force: true });
  await ShiftSignal.destroy({ where: {}, force: true });
  await Shift.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Ride API Integration Tests', () => {

  describe('POST /api/rides/evaluate-ride', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/rides/evaluate-ride returns 401 when no authentication provided
      const requestBody = {
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/evaluate-ride')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 200 and predicted score when authenticated with valid coordinates', async () => {
      // Test authenticated user can successfully evaluate ride
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/evaluate-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rating).toBeGreaterThanOrEqual(1);
      expect(res.body.rating).toBeLessThanOrEqual(5);
    });

    it('should return 400 when authenticated but invalid coordinates provided', async () => {
      // Test authenticated user gets validation error for invalid coordinates
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        start_latitude: 'invalid',
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/evaluate-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid coordinates');
    });

    it('should return 400 when authenticated but missing required coordinates', async () => {
      // Test authenticated user gets validation error for missing coordinates
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        start_latitude: 53.349805,
        start_longitude: -6.260310
        // Missing destination coordinates
      };

      const res = await request(app)
        .post('/api/rides/evaluate-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required coordinates');
    });
  });

  describe('POST /api/rides/start-ride', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/rides/start-ride returns 401 when no authentication provided
      const requestBody = {
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/start-ride')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no active shift', async () => {
      // Test authenticated driver cannot start ride without active shift
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Cannot start ride');
    });

    it('should return 400 when authenticated but invalid coordinates provided', async () => {
      // Test authenticated user gets validation error for invalid coordinates
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        start_latitude: 'invalid',
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid coordinates');
    });
  });

  describe('POST /api/rides/get-ride-status', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/rides/get-ride-status returns 401 when no authentication provided
      const res = await request(app)
        .post('/api/rides/get-ride-status')
        .send({});
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no active ride', async () => {
      // Test authenticated driver with no active ride gets appropriate error
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .post('/api/rides/get-ride-status')
        .set('Authorization', `Bearer ${token}`)
        .send({});
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active ride');
    });

    it('should return 400 when authenticated but invalid override destination provided', async () => {
      // Test authenticated user gets validation error for invalid override destination
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        destination_latitude: 'invalid',
        destination_longitude: -6.262321
      };

      const res = await request(app)
        .post('/api/rides/get-ride-status')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid coordinates');
    });
  });

  describe('POST /api/rides/end-ride', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/rides/end-ride returns 401 when no authentication provided
      const requestBody = {
        fare_cents: 1450,
        actual_distance_km: 4.2
      };

      const res = await request(app)
        .post('/api/rides/end-ride')
        .send(requestBody);
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no active ride', async () => {
      // Test authenticated driver with no active ride cannot end ride
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        fare_cents: 1450,
        actual_distance_km: 4.2
      };

      const res = await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active ride');
    });

    it('should return 400 when authenticated but missing required fields', async () => {
      // Test authenticated user gets validation error for missing fields
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        fare_cents: 1450
        // Missing actual_distance_km
      };

      const res = await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return 400 when authenticated but invalid field types provided', async () => {
      // Test authenticated user gets validation error for invalid field types
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        fare_cents: 'invalid',
        actual_distance_km: 4.2
      };

      const res = await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid fare or distance');
    });
  });

  describe('Database Constraints', () => {
    it('should violate unique constraint when creating second active ride for same shift', async () => {
      // Test that inserting a second ride for the same shift_id with end_time IS NULL violates the one_active_ride_per_shift unique constraint
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      // Create first active ride
      await Ride.create({
        shift_id: shift.id,
        driver_id: user.id,
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.359805,
        destination_longitude: -6.270310,
        start_time: new Date(),
        predicted_score: 3,
        end_time: null // Active ride
      });

      // Attempt to create second active ride for same shift - should fail
      await expect(Ride.create({
        shift_id: shift.id, // Same shift
        driver_id: user.id,
        start_latitude: 53.359805,
        start_longitude: -6.270310,
        destination_latitude: 53.369805,
        destination_longitude: -6.280310,
        start_time: new Date(),
        predicted_score: 4,
        end_time: null // Active ride - should violate constraint
      })).rejects.toThrow(); // Expecting constraint violation
    });
  });

}); 