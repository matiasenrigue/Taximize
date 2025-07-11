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
    address: "Test Delete Completed Ride Address",
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
    address: "Test Delete Active Ride Address",
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

describe('Delete Ride Operations', () => {
  describe('Soft Delete Implementation', () => {
    it('Tests-ED-19-Soft-delete-completed-ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Ride deleted successfully');

      // Verify ride is soft deleted
      const deletedRide = await Ride.findByPk(ride.id, { paranoid: false });
      expect(deletedRide).toBeTruthy();
      // Check both possible field names
      const deletedAt = deletedRide!.deleted_at || (deletedRide as any).deletedAt;
      expect(deletedAt).toBeTruthy();
    });

    it('Tests-ED-20-Cannot-delete-active-ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createActiveRide(shift.id, user.id);

      const response = await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete active ride');
    });

    it('Tests-ED-21-Standard-queries-exclude-deleted-rides', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride1 = await createCompletedRide(shift.id, user.id);
      const ride2 = await createCompletedRide(shift.id, user.id);

      // Delete one ride
      await request(app)
        .delete(`/api/rides/${ride1.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Get all rides - should only return non-deleted ride
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(ride2.id);
    });
  });

  describe('Authorization', () => {
    it('Tests-ED-22-Cannot-delete-other-driver-ride', async () => {
      const { user: driver1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
      const { user: driver2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');
      
      const shift = await createActiveShift(driver2.id);
      const ride = await createCompletedRide(shift.id, driver2.id);

      const response = await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    it('Tests-ED-23-Driver-can-delete-own-completed-ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Ride deleted successfully');
    });
  });

  describe('Restore Operations', () => {
    it('Tests-ED-24-Can-restore-soft-deleted-ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      // Delete the ride
      await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Restore the ride
      const response = await request(app)
        .post(`/api/rides/${ride.id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Ride restored successfully');

      // Verify ride is restored
      const restoredRide = await Ride.findByPk(ride.id);
      expect(restoredRide).toBeTruthy();
      // Check both possible field names
      const deletedAt = restoredRide!.deleted_at || (restoredRide as any).deletedAt;
      expect(deletedAt).toBeNull();
    });

    it('Tests-ED-25-Cannot-restore-non-deleted-ride', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      const response = await request(app)
        .post(`/api/rides/${ride.id}/restore`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not deleted');
    });

    it('Tests-ED-26-Cannot-restore-other-driver-ride', async () => {
      const { user: driver1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
      const { user: driver2, token: token2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');
      
      const shift = await createActiveShift(driver2.id);
      const ride = await createCompletedRide(shift.id, driver2.id);

      // Driver 2 deletes their ride
      await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token2}`);

      // Driver 1 tries to restore it
      const response = await request(app)
        .post(`/api/rides/${ride.id}/restore`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('Data Consistency', () => {
    it('Tests-ED-27-Updates-shift-statistics-on-ride-delete', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride1 = await createCompletedRide(shift.id, user.id);
      const ride2 = await createCompletedRide(shift.id, user.id);

      // Get initial shift statistics
      const initialShiftResponse = await request(app)
        .get(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      const initialEarnings = initialShiftResponse.body.total_earnings_cents;
      const initialDistance = initialShiftResponse.body.total_distance_km;

      // Delete one ride
      await request(app)
        .delete(`/api/rides/${ride1.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify shift statistics updated
      const updatedShiftResponse = await request(app)
        .get(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(updatedShiftResponse.body.total_earnings_cents).toBeLessThan(initialEarnings);
      expect(updatedShiftResponse.body.total_distance_km).toBeLessThan(initialDistance);
    });

    it('Tests-ED-28-Maintains-referential-integrity', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      // Delete the ride
      await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify shift still exists
      const shiftResponse = await request(app)
        .get(`/api/shifts/${shift.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(shiftResponse.status).toBe(200);
      expect(shiftResponse.body.id).toBe(shift.id);
    });
  });

  describe('Performance Metrics Update', () => {
    it('Tests-ED-29-Recalculates-driver-performance-on-delete', async () => {
      const { user, token } = await createAuthenticatedUser();
      const shift = await createActiveShift(user.id);
      const ride = await createCompletedRide(shift.id, user.id);

      // Get initial driver stats
      const initialStatsResponse = await request(app)
        .get('/api/users/me/stats')
        .set('Authorization', `Bearer ${token}`);
      
      const initialRideCount = initialStatsResponse.body.totalRides;

      // Delete the ride
      await request(app)
        .delete(`/api/rides/${ride.id}`)
        .set('Authorization', `Bearer ${token}`);

      // Verify driver stats updated
      const updatedStatsResponse = await request(app)
        .get('/api/users/me/stats')
        .set('Authorization', `Bearer ${token}`);
      
      expect(updatedStatsResponse.body.totalRides).toBe(initialRideCount - 1);
    });
  });
});