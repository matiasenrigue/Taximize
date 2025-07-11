import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
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

// Helper function to create completed ride
async function createCompletedRide(shiftId: string, driverId: string) {
  return await Ride.create({
    shift_id: shiftId,
    driver_id: driverId,
    start_time: new Date(Date.now() - 3600000), // 1 hour ago
    end_time: new Date(Date.now() - 1800000), // 30 minutes ago
    start_latitude: 53.349805,
    start_longitude: -6.260310,
    destination_latitude: 53.343792,
    destination_longitude: -6.254572,
    address: "Test Completed Ride Address",
    distance_km: 5.2,
    earning_cents: 1250,
    predicted_score: 0.75
  });
}

// Helper function to create active ride
async function createActiveRide(shiftId: string, driverId: string) {
  return await Ride.create({
    shift_id: shiftId,
    driver_id: driverId,
    start_time: new Date(Date.now() - 900000), // 15 minutes ago
    end_time: null,
    start_latitude: 53.349805,
    start_longitude: -6.260310,
    destination_latitude: 53.343792,
    destination_longitude: -6.254572,
    address: "Test Active Ride Address",
    distance_km: 5.2,
    earning_cents: 1250,
    predicted_score: 0.75
  });
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await User.destroy({ where: {} });
  await Ride.destroy({ where: {} });
  await Shift.destroy({ where: {} });
  await ShiftSignal.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Edit Ride Operations', () => {
  describe('Active Ride Restrictions', () => {
    it('Tests-ED-1-Cannot-edit-active-ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createActiveRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          destination_latitude: 53.350000,
          destination_longitude: -6.250000
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot edit active ride');
    });
  });

  describe('Basic Data Integrity Rules', () => {
    it('Tests-ED-2-End-time-must-be-after-start-time', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          endTime: new Date(ride.start_time.getTime() - 3600000) // 1 hour before start
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('End time must be after start time');
    });

    it('Tests-ED-3-Distance-must-be-positive', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          distanceKm: -5.0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Distance must be positive');
    });

    it('Tests-ED-4-Earning-must-be-positive', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          earningCents: -100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Earning must be positive');
    });

    it('Tests-ED-5-Coordinates-must-be-within-valid-ranges', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          destination_latitude: 95.0, // Invalid latitude > 90
          destination_longitude: -185.0 // Invalid longitude < -180
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid coordinates');
    });

    it('Tests-ED-6-Cannot-modify-start-time-to-future', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const futureTime = new Date(Date.now() + 3600000); // 1 hour in future
      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_time: futureTime
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify start_time');
    });
  });

  describe('Allowed Edit Fields', () => {
    it('Tests-ED-7-Can-edit-destination-coordinates', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          destinationLatitude: 53.350000,
          destinationLongitude: -6.250000
        });

      expect(response.status).toBe(200);
      expect(response.body.destinationLatitude).toBe(53.350000);
      expect(response.body.destinationLongitude).toBe(-6.250000);
    });

    it('Tests-ED-8-Can-edit-distance', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          distanceKm: 6.5
        });

      expect(response.status).toBe(200);
      expect(response.body.distanceKm).toBe(6.5);
    });

    it('Tests-ED-9-Can-edit-earning', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          earningCents: 1500
        });

      expect(response.status).toBe(200);
      expect(response.body.earningCents).toBe(1500);
    });

    it('Tests-ED-10-Can-edit-end-time', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const newEndTime = new Date(Date.now() - 600000); // 10 minutes ago
      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          endTime: newEndTime
        });

      expect(response.status).toBe(200);
      expect(new Date(response.body.endTime)).toEqual(newEndTime);
    });
  });

  describe('Forbidden Edit Fields', () => {
    it('Tests-ED-11-Cannot-edit-ride-id', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          id: 'new-id-123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify id');
    });

    it('Tests-ED-12-Cannot-edit-shift-id', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_id: 'different-shift-id'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify shift_id');
    });

    it('Tests-ED-13-Cannot-edit-driver-id', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          driver_id: 'different-driver-id'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify driver_id');
    });

    it('Tests-ED-14-Cannot-edit-start-time', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_time: new Date()
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify start_time');
    });

    it('Tests-ED-15-Cannot-edit-start-coordinates', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          start_latitude: 53.360000,
          start_longitude: -6.270000
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify start_latitude');
    });

    it('Tests-ED-16-Cannot-edit-predicted-score', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          predicted_score: 0.95
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot modify predicted_score');
    });
  });

  describe('Authorization', () => {
    it('Tests-ED-17-Cannot-edit-other-driver-ride', async () => {
      const { user: driver1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
      const { user: driver2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');
      
      const shift = await createActiveShift(driver2.id);
      const ride = await createCompletedRide(shift.id, driver2.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          distanceKm: 10.0
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('Shift Statistics Update', () => {
    it('Tests-ED-18-Updates-shift-statistics-on-ride-edit', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .put(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          earning_cents: 2000,
          distance_km: 10.0
        });

      expect(response.status).toBe(200);
      
      // Verify shift statistics updated
      const shiftResponse = await request(app)
        .get(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(shiftResponse.body.total_earnings_cents).toBeGreaterThan(0);
      expect(shiftResponse.body.total_distance_km).toBeGreaterThan(0);
    });
  });
});