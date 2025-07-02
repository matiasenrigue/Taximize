import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import app from '../../../../app';
import User from '../../../users/user.model';
import Ride from '../../../rides/ride.model';
import Shift from '../../shift.model';
import ShiftSignal from '../../shift-signal.model';
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

// Helper function to create completed shift
async function createCompletedShift(driverId: string) {
  const shiftStart = new Date(Date.now() - 14400000); // 4 hours ago
  const shiftEnd = new Date(Date.now() - 3600000); // 1 hour ago
  
  return await Shift.create({
    driver_id: driverId,
    shift_start: shiftStart,
    shift_end: shiftEnd,
    shift_start_location_latitude: 53.349805,
    shift_start_location_longitude: -6.260310,
    shift_end_location_latitude: 53.343792,
    shift_end_location_longitude: -6.254572,
    total_duration_ms: 10800000, // 3 hours
    work_time_ms: 9000000, // 2.5 hours
    break_time_ms: 1800000, // 30 minutes
    num_breaks: 2,
    avg_break_ms: 900000 // 15 minutes
  });
}

// Helper function to create active shift
async function createActiveShift(driverId: string) {
  return await Shift.create({
    driver_id: driverId,
    shift_start: new Date(Date.now() - 7200000), // 2 hours ago
    shift_end: null,
    shift_start_location_latitude: 53.349805,
    shift_start_location_longitude: -6.260310
  });
}

// Helper function to create ride within shift
async function createRideInShift(shiftId: string, driverId: string, startOffset: number, endOffset: number) {
  return await Ride.create({
    shift_id: shiftId,
    driver_id: driverId,
    start_time: new Date(Date.now() - startOffset),
    end_time: new Date(Date.now() - endOffset),
    start_latitude: 53.349805,
    start_longitude: -6.260310,
    destination_latitude: 53.343792,
    destination_longitude: -6.254572,
    distance_km: 5.2,
    earning_cents: 1250,
    predicted_score: 0.75
  });
}

// Helper function to create shift with 24+ hours duration
async function createLongShift(driverId: string) {
  const shiftStart = new Date(Date.now() - 90000000); // 25 hours ago
  const shiftEnd = new Date(Date.now() - 3600000); // 1 hour ago
  
  return await Shift.create({
    driver_id: driverId,
    shift_start: shiftStart,
    shift_end: shiftEnd,
    shift_start_location_latitude: 53.349805,
    shift_start_location_longitude: -6.260310,
    shift_end_location_latitude: 53.343792,
    shift_end_location_longitude: -6.254572
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

describe('Edit Shift Operations', () => {
  describe('Active Shift Restrictions', () => {
    it('Tests-ED-30-Cannot-edit-active-shift', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_start: new Date(Date.now() - 10800000) // 3 hours ago
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot edit active shift');
    });

    it('Tests-ED-31-Must-end-shift-before-editing', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);

      // First, end the shift
      await request(app)
        .post(`/api/shifts/${shift.id}/end`)
        .set('Authorization', `Bearer ${token}`);

      // Now try to edit
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: new Date()
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Temporal Boundaries', () => {
    it('Tests-ED-32-Shift-cannot-exceed-24-hours', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      // Try to set start time 25 hours before the shift's current end time
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_start: new Date(shift.shift_end!.getTime() - (25 * 60 * 60 * 1000)) // 25 hours before end
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Shift cannot exceed 24 hours');
    });

    it('Tests-ED-33-Shift-start-must-be-before-end', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_start: new Date(Date.now()), // Now (after shift_end)
          shift_end: new Date(Date.now() - 3600000) // 1 hour ago
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Shift start must be before shift end');
    });
  });

  describe('Consistency with Rides', () => {
    it('Tests-ED-34-Shift-must-encompass-all-rides', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);
      
      // Create a ride within the shift
      await createRideInShift(shift.id, user.id, 10800000, 7200000); // 3 hours ago to 2 hours ago

      // Try to edit shift to not encompass the ride
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: new Date(Date.now() - 10000000) // 2.8 hours ago (before ride start)
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Shift must encompass all rides');
    });

    it('Tests-ED-35-Cannot-edit-shift-times-invalidating-rides', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);
      
      // Create multiple rides
      await createRideInShift(shift.id, user.id, 13000000, 12000000); // Early ride
      await createRideInShift(shift.id, user.id, 5000000, 4000000); // Late ride

      // Try to edit shift start after first ride
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_start: new Date(Date.now() - 11000000) // After first ride started
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Shift must encompass all rides');
    });

    it('Tests-ED-36-Auto-recalculates-shift-statistics', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      // Set end time to 2 hours ago (making duration 2 hours instead of 3)
      const newShiftEnd = new Date(Date.now() - 7200000); // 2 hours ago
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: newShiftEnd
        });

      expect(response.status).toBe(200);
      expect(response.body.total_duration_ms).toBeLessThan(shift.total_duration_ms || 0);
      expect(response.body.work_time_ms).toBeLessThan(shift.work_time_ms || 0);
    });
  });

  describe('Break Time Validation', () => {
    it('Tests-ED-37-Break-times-must-be-within-shift', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      // Create a break signal
      await ShiftSignal.create({
        shift_id: shift.id,
        driver_id: user.id,
        signal: 'pause',
        timestamp: new Date(Date.now() - 7200000) // 2 hours ago
      });

      // Try to edit shift to not encompass break
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_start: new Date(Date.now() - 6000000) // 1.67 hours ago (after break)
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Break times must be within shift boundaries');
    });
  });

  describe('Allowed Edit Fields', () => {
    it('Tests-ED-38-Can-edit-shift-start-time', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      const newStartTime = new Date(Date.now() - 18000000); // 5 hours ago
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_start: newStartTime
        });

      expect(response.status).toBe(200);
      expect(new Date(response.body.shift_start)).toEqual(newStartTime);
    });

    it('Tests-ED-39-Can-edit-shift-end-time', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      const newEndTime = new Date(Date.now() - 1800000); // 30 minutes ago
      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: newEndTime
        });

      expect(response.status).toBe(200);
      expect(new Date(response.body.shift_end)).toEqual(newEndTime);
    });
  });

  describe('Auto-Recalculated Fields', () => {
    it('Tests-ED-40-Recalculates-total-duration', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      const originalDuration = shift.total_duration_ms || 0;
      const newEndTime = new Date(shift.shift_end!.getTime() + 3600000); // Add 1 hour

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: newEndTime
        });

      expect(response.status).toBe(200);
      expect(response.body.total_duration_ms).toBe(originalDuration + 3600000);
    });

    it('Tests-ED-41-Recalculates-work-time', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      // Add pause/resume signals to affect work time
      await ShiftSignal.create({
        shift_id: shift.id,
        driver_id: user.id,
        signal: 'pause',
        timestamp: new Date(shift.shift_start.getTime() + 3600000) // 1 hour after start
      });

      await ShiftSignal.create({
        shift_id: shift.id,
        driver_id: user.id,
        signal: 'resume',
        timestamp: new Date(shift.shift_start.getTime() + 5400000) // 1.5 hours after start
      });

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: new Date(shift.shift_end!.getTime() + 3600000) // Extend by 1 hour
        });

      expect(response.status).toBe(200);
      expect(response.body.work_time_ms).toBeGreaterThan(0);
      expect(response.body.break_time_ms).toBeGreaterThan(0);
    });

    it('Tests-ED-42-Recalculates-break-statistics', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: new Date(Date.now() - 900000) // 15 minutes ago
        });

      expect(response.status).toBe(200);
      expect(response.body.num_breaks).toBeDefined();
      expect(response.body.avg_break_ms).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('Tests-ED-43-Cannot-edit-other-driver-shift', async () => {
      const { user: driver1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
      const { user: driver2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');
      
      const shift = await createCompletedShift(driver2.id);

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          shift_end: new Date()
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    it('Tests-ED-44-Driver-can-edit-own-shift', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createCompletedShift(user.id);

      const response = await request(app)
        .put(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          shift_end: new Date(Date.now() - 1800000)
        });

      expect(response.status).toBe(200);
    });
  });
});