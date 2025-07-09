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
  return { user, token, driver: user };
}

// Helper function to create active shift
async function createActiveShift(driverId: string) {
  return await Shift.create({
    driver_id: driverId,
    shift_start: new Date(),
    shift_end: null,
    shift_start_location_latitude: 53.349805,
    shift_start_location_longitude: -6.260310
  });
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
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
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
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
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
        startLatitude: 'invalid',
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
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
        startLatitude: 53.349805,
        startLongitude: -6.260310
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
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
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
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
      };

      const res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active shift found');
    });

    it('should return 400 when authenticated but invalid coordinates provided', async () => {
      // Test authenticated user gets validation error for invalid coordinates
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        startLatitude: 'invalid',
        startLongitude: -6.260310,
        destinationLatitude: 53.359805,
        destinationLongitude: -6.270310
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

  describe('GET /api/rides/current', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test GET /api/rides/current returns 401 when no authentication provided
      const res = await request(app)
        .get('/api/rides/current');
        
      // Expecting 401 since routes are implemented but require authentication (Green phase)
      expect(res.status).toBe(401);
    });

    it('should return 400 when authenticated driver has no active shift', async () => {
      // Test authenticated driver with no active shift gets appropriate error
      const { token } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/rides/current')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active shift found. Please start a shift before checking ride status.');
    });

    it('should return 400 when authenticated but no active ride exists', async () => {
      // Test authenticated driver with active shift but no ride
      const { token, driver } = await createAuthenticatedUser();
      await createActiveShift(driver.id);

      const res = await request(app)
        .get('/api/rides/current')
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active ride found. Please start a ride first.');
    });
  });

  describe('POST /api/rides/end-ride', () => {
    it('should return 401 when no authentication provided', async () => {
      // Test POST /api/rides/end-ride returns 401 when no authentication provided
      const requestBody = {
        fareCents: 1450,
        actualDistanceKm: 4.2
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
        fareCents: 1450,
        actualDistanceKm: 4.2
      };

      const res = await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send(requestBody);
        
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No active shift found. Please start a shift before checking ride status.');
    });

    it('should return 400 when authenticated but missing required fields', async () => {
      // Test authenticated user gets validation error for missing fields
      const { token } = await createAuthenticatedUser();
      
      const requestBody = {
        fareCents: 1450
        // Missing actualDistanceKm
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
        fareCents: 'invalid',
        actualDistanceKm: 4.2
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
        startLatitude: 53.359805,
        startLongitude: -6.270310,
        destinationLatitude: 53.369805,
        destinationLongitude: -6.280310,
        start_time: new Date(),
        predicted_score: 4,
        end_time: null // Active ride - should violate constraint
      })).rejects.toThrow(); // Expecting constraint violation
    });
  });

}); 