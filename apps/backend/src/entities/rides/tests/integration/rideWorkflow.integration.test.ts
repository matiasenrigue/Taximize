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
  // Use force: true to hard delete even with paranoid mode
  await Ride.destroy({ where: {}, force: true });
  await ShiftSignal.destroy({ where: {}, force: true });
  await Shift.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Ride Workflow Integration Tests', () => {

  describe('Complete Ride Lifecycle', () => {
    it('should handle full ride lifecycle: start → status → end', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // 1. Start ride
      const startRideRes = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.349805,
          start_longitude: -6.260310,
          destination_latitude: 53.359805,
          destination_longitude: -6.270310
        });

      expect(startRideRes.status).toBe(200);
      const rideId = startRideRes.body.data.rideId;

      // 2. Get ride status
      const statusRes = await request(app)
        .post('/api/rides/get-ride-status')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.rideId).toBe(rideId);
      expect(statusRes.body.data.elapsed_time_ms).toBeGreaterThan(0);

      // 3. End ride
      const endRideRes = await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fare_cents: 1500,
          actual_distance_km: 5.2
        });

      expect(endRideRes.status).toBe(200);
      expect(endRideRes.body.data.rideId).toBe(rideId);
      expect(endRideRes.body.data.earning_cents).toBe(1500);

      // 4. Verify ride is ended in database
      const finalRide = await Ride.findByPk(rideId);
      expect(finalRide!.end_time).not.toBeNull();
      expect(finalRide!.earning_cents).toBe(1500);
    });

    it('should handle multiple sequential rides on same shift', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // First ride
      const ride1Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.349805,
          start_longitude: -6.260310,
          destination_latitude: 53.359805,
          destination_longitude: -6.270310
        });

      expect(ride1Res.status).toBe(200);
      const ride1Id = ride1Res.body.data.rideId;

      // End first ride
      await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fare_cents: 1000,
          actual_distance_km: 3.0
        });

      // Second ride should succeed
      const ride2Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.359805,
          start_longitude: -6.270310,
          destination_latitude: 53.369805,
          destination_longitude: -6.280310
        });

      expect(ride2Res.status).toBe(200);
      const ride2Id = ride2Res.body.data.rideId;
      expect(ride2Id).not.toBe(ride1Id);

      // Verify both rides exist in database with same shift
      const rides = await Ride.findAll({ where: { shift_id: shift.id } });
      expect(rides).toHaveLength(2);
      expect(rides[0].shift_id).toBe(shift.id);
      expect(rides[1].shift_id).toBe(shift.id);
    });

    it('should handle ride with override destination in status check', async () => {
      const { user, token } = await createAuthenticatedUser();
      await createActiveShift(user.id);

      // Start ride
      await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.349805,
          start_longitude: -6.260310,
          destination_latitude: 53.359805,
          destination_longitude: -6.270310
        });

      // Get status with override destination
      const statusRes = await request(app)
        .post('/api/rides/get-ride-status')
        .set('Authorization', `Bearer ${token}`)
        .send({
          destination_latitude: 53.369805,
          destination_longitude: -6.280310
        });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.current_destination_latitude).toBe(53.369805);
      expect(statusRes.body.data.current_destination_longitude).toBe(-6.280310);
    });
  });

  describe('Multiple Shifts and Rides', () => {
    it('should handle rides across different shifts', async () => {
      const { user, token } = await createAuthenticatedUser();
      
      // First shift and ride
      const shift1 = await createActiveShift(user.id);
      const ride1Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.349805,
          start_longitude: -6.260310,
          destination_latitude: 53.359805,
          destination_longitude: -6.270310
        });

      expect(ride1Res.status).toBe(200);
      const ride1Id = ride1Res.body.data.rideId;

      // End first ride and shift
      await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fare_cents: 1000,
          actual_distance_km: 3.0
        });

      await shift1.update({ shift_end: new Date() });

      // Second shift and ride
      const shift2 = await createActiveShift(user.id);
      const ride2Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.369805,
          start_longitude: -6.280310,
          destination_latitude: 53.379805,
          destination_longitude: -6.290310
        });

      expect(ride2Res.status).toBe(200);
      const ride2Id = ride2Res.body.data.rideId;

      // Verify rides belong to different shifts
      const finalRide1 = await Ride.findByPk(ride1Id);
      const finalRide2 = await Ride.findByPk(ride2Id);
      
      expect(finalRide1!.shift_id).toBe(shift1.id);
      expect(finalRide2!.shift_id).toBe(shift2.id);
      expect(finalRide1!.shift_id).not.toBe(finalRide2!.shift_id);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should prevent second ride start while first is active', async () => {
      const { user, token } = await createAuthenticatedUser();
      await createActiveShift(user.id);

      // Start first ride
      const ride1Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.349805,
          start_longitude: -6.260310,
          destination_latitude: 53.359805,
          destination_longitude: -6.270310
        });

      expect(ride1Res.status).toBe(200);

      // Attempt second ride should fail
      const ride2Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.359805,
          start_longitude: -6.270310,
          destination_latitude: 53.369805,
          destination_longitude: -6.280310
        });

      expect(ride2Res.status).toBe(400);
      expect(ride2Res.body.error).toContain('Cannot start ride');
    });

    it('should handle ride start immediately after ending previous ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      await createActiveShift(user.id);

      // Start and end first ride
      const ride1Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.349805,
          start_longitude: -6.260310,
          destination_latitude: 53.359805,
          destination_longitude: -6.270310
        });

      expect(ride1Res.status).toBe(200);

      await request(app)
        .post('/api/rides/end-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fare_cents: 1000,
          actual_distance_km: 3.0
        });

      // Immediate second ride should succeed
      const ride2Res = await request(app)
        .post('/api/rides/start-ride')
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.359805,
          start_longitude: -6.270310,
          destination_latitude: 53.369805,
          destination_longitude: -6.280310
        });

      expect(ride2Res.status).toBe(200);
      expect(ride2Res.body.data.rideId).not.toBe(ride1Res.body.data.rideId);
    });
  });
});