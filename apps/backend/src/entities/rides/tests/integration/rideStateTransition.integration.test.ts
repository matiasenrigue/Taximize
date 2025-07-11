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
  await Ride.destroy({ where: {}, force: true });
  await ShiftSignal.destroy({ where: {}, force: true });
  await Shift.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Ride State Transition Tests', () => {

  describe('Shift State Impact on Rides', () => {
    it('should prevent ride start when shift is ended', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // End the shift
      await shift.update({ shift_end: new Date() });

      // Attempt to start ride should fail
      const rideRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address for Ended Shift"
        });

      expect(rideRes.status).toBe(400);
      expect(rideRes.body.error).toContain('No active shift found');
    });

    it('should handle ride status check after shift termination', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // Start ride
      const startRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address Status Check After Termination"
        });

      expect(startRes.status).toBe(200);

      // End the shift while ride is active
      await shift.update({ shift_end: new Date() });

      // Get ride status should fail (no active shift)
      const statusRes = await request(app)
        .get('/api/rides/current')
        .set('Authorization', `Bearer ${token}`);

      expect(statusRes.status).toBe(400);
      expect(statusRes.body.error).toContain('No active shift found');
    });

    it('should handle ride end after shift termination', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // Start ride
      const startRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address End After Termination"
        });

      expect(startRes.status).toBe(200);

      // End the shift while ride is active
      await shift.update({ shift_end: new Date() });

      // End ride should fail (no active shift to find ride)
      const endRes = await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fareCents: 1500,
          actualDistanceKm: 5.0
        });

      expect(endRes.status).toBe(400);
      expect(endRes.body.error).toContain('No active shift found');
    });
  });

  describe('Driver Availability State Changes', () => {
    it('should prevent ride start when driver becomes unavailable', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // Create a pause signal to make driver unavailable
      await ShiftSignal.create({
        shift_id: shift.id,
        signal: 'pause',
        timestamp: new Date()
      });

      // Attempt to start ride should fail
      const rideRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address Driver Unavailable"
        });

      expect(rideRes.status).toBe(400);
      expect(rideRes.body.error).toContain('Cannot start ride while on break. Please continue your shift first.');
    });

    it('should allow ride start after driver becomes available again', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // Pause driver
      await ShiftSignal.create({
        shift_id: shift.id,
        signal: 'pause',
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      });

      // Resume driver
      await ShiftSignal.create({
        shift_id: shift.id,
        signal: 'continue',
        timestamp: new Date()
      });

      // Ride start should succeed
      const rideRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address Driver Available Again"
        });

      expect(rideRes.status).toBe(200);
      expect(rideRes.body.data.rideId).toBeDefined();
    });
  });

  describe('Concurrent Operation Scenarios', () => {
    it('should handle rapid successive ride attempts', async () => {
      const { user, token } = await createAuthenticatedUser();
      await createActiveShift(user.id);

      // Make multiple rapid requests
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .post('/api/rides/start-ride')
          .set('Authorization', `Bearer ${token}`)
          .send({
            startLatitude: 53.349805,
            startLongitude: -6.260310,
            destinationLatitude: 53.359805,
            destinationLongitude: -6.270310,
            address: "Test Address Rapid Successive Attempts"
          })
      );

      const responses = await Promise.all(requests);

      // Only one should succeed
      const successfulResponses = responses.filter(res => res.status === 200);
      const failedResponses = responses.filter(res => res.status === 400);

      expect(successfulResponses).toHaveLength(1);
      expect(failedResponses).toHaveLength(2);
      
      failedResponses.forEach(res => {
        // Error could be either "Already has active ride" or "Validation error" due to unique constraint
        expect(res.body.error).toMatch(/Already has active ride|Validation error/);
      });
    });

    it('should handle concurrent ride operations on different shifts', async () => {
      // Create two different drivers
      const { user: user1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
      const { user: user2, token: token2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');

      // Create active shifts for both
      await createActiveShift(user1.id);
      await createActiveShift(user2.id);

      // Both should be able to start rides simultaneously
      const requests = [
        request(app)
          .post('/api/rides/start-ride')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            startLatitude: 53.349805,
            startLongitude: -6.260310,
            destinationLatitude: 53.359805,
            destinationLongitude: -6.270310,
            address: "Test Address Concurrent Driver 1"
          }),
        request(app)
          .post('/api/rides/start-ride')
          .set('Authorization', `Bearer ${token2}`)
          .send({
            startLatitude: 53.369805,
            startLongitude: -6.280310,
            destinationLatitude: 53.379805,
            destinationLongitude: -6.290310,
            address: "Test Address Concurrent Driver 2"
          })
      ];

      const responses = await Promise.all(requests);

      // Both should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.data.rideId).toBeDefined();
      });

      // Verify different ride IDs
      expect(responses[0].body.data.rideId).not.toBe(responses[1].body.data.rideId);
    });
  });

  describe('Database State Consistency', () => {
    it('should maintain consistent state during ride lifecycle', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // Start ride
      const startRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address Database State Consistency"
        });

      const rideId = startRes.body.data.rideId;

      // Check database state at each step
      let ride = await Ride.findByPk(rideId);
      expect(ride!.shift_id).toBe(shift.id);
      expect(ride!.end_time).toBeNull();
      expect(ride!.earning_cents).toBeNull();

      // End ride
      await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fareCents: 1500,
          actualDistanceKm: 5.0
        });

      // Check final state
      ride = await Ride.findByPk(rideId);
      expect(ride!.end_time).not.toBeNull();
      expect(ride!.earning_cents).toBe(1500);
      expect(ride!.distance_km).toBe(5.0);
    });

    it('should handle shift deletion edge cases', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // Start ride
      const startRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          startLatitude: 53.349805,
          startLongitude: -6.260310,
          destinationLatitude: 53.359805,
          destinationLongitude: -6.270310,
          address: "Test Address Shift Deletion Edge Case"
        });

      expect(startRes.status).toBe(200);

      // Verify ride exists and references shift
      const ride = await Ride.findByPk(startRes.body.data.rideId);
      expect(ride!.shift_id).toBe(shift.id);

      // In SQLite with soft deletes, the shift can be soft-deleted
      // In a real PostgreSQL environment with strict foreign keys, this would fail
      await shift.destroy();
      
      // But the shift should be soft-deleted, not hard-deleted
      const deletedShift = await Shift.findByPk(shift.id, { paranoid: false });
      expect(deletedShift).toBeDefined();
      expect(deletedShift!.deleted_at).not.toBeNull();
    });
  });
});