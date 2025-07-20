import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import app from '../../../../app';
import User from '../../../users/user.model';
import Ride from '../../../rides/ride.model';
import Shift from '../../shift.model';
import ShiftSignal from '../../shiftSignal.model';
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
async function createRideInShift(shiftId: string, driverId: string) {
    return await Ride.create({
        shift_id: shiftId,
        driver_id: driverId,
        start_time: new Date(Date.now() - 10800000), // 3 hours ago
        end_time: new Date(Date.now() - 7200000), // 2 hours ago
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.343792,
        destination_longitude: -6.254572,
        address: "Test Delete Shift Ride Address",
        distance_km: 5.2,
        earning_cents: 1250,
        predicted_score: 0.75
    });
}

// Helper function to create deleted ride
async function createDeletedRide(shiftId: string, driverId: string) {
    const ride = await Ride.create({
        shift_id: shiftId,
        driver_id: driverId,
        start_time: new Date(Date.now() - 10800000),
        end_time: new Date(Date.now() - 7200000),
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_latitude: 53.343792,
        destination_longitude: -6.254572,
        address: "Test Deleted Ride Address",
        distance_km: 5.2,
        earning_cents: 1250,
        predicted_score: 0.75
    });
    
    await ride.destroy(); // Soft delete
    return ride;
}

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await User.destroy({ where: {} });
    await Ride.destroy({ where: {}, force: true });
    await Shift.destroy({ where: {}, force: true });
    await ShiftSignal.destroy({ where: {} });
});

afterAll(async () => {
    await sequelize.close();
});


describe('Delete Shift Operations', () => {
    describe('Cascade Rules', () => {
        it('Tests-ED-45-Cannot-delete-shift-with-rides', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            await createRideInShift(shift.id, user.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Cannot delete shift with associated rides');
        });


        it('Tests-ED-46-Can-delete-shift-after-deleting-rides', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            const ride = await createRideInShift(shift.id, user.id);

            // First delete the ride
            await request(app)
                .delete(`/api/rides/${ride.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Now delete the shift
            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Shift deleted successfully');
        });


        it('Tests-ED-47-Shows-warning-about-data-loss', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            await createRideInShift(shift.id, user.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('delete rides first');
        });


        it('Tests-ED-48-Can-delete-shift-with-only-deleted-rides', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            await createDeletedRide(shift.id, user.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Shift deleted successfully');
        });
    });


    describe('Soft Delete Implementation', () => {
        it('Tests-ED-49-Implements-soft-delete-with-timestamp', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);

            // Verify shift is soft deleted
            const deletedShift = await Shift.findByPk(shift.id, { paranoid: false });
            expect(deletedShift).toBeTruthy();
            // Check both possible field names
            const deletedAt = deletedShift!.deleted_at || (deletedShift as any).deletedAt;
            expect(deletedAt).toBeTruthy();
        });


        it('Tests-ED-50-Standard-queries-exclude-deleted-shifts', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift1 = await createCompletedShift(user.id);
            const shift2 = await createCompletedShift(user.id);

            // Delete one shift
            await request(app)
                .delete(`/api/shifts/${shift1.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Get all shifts - should only return non-deleted shift
            const response = await request(app)
                .get('/api/shifts')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe(shift2.id);
        });


        it('Tests-ED-51-Cannot-delete-active-shift', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createActiveShift(user.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Cannot delete active shift');
        });
    });


    describe('Restore Operations', () => {
        it('Tests-ED-52-Can-restore-deleted-shift', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);

            // Delete the shift
            await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Restore the shift
            const response = await request(app)
                .post(`/api/shifts/${shift.id}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Shift restored successfully');

            // Verify shift is restored
            const restoredShift = await Shift.findByPk(shift.id);
            expect(restoredShift).toBeTruthy();
            // Check both possible field names
            const deletedAt = restoredShift!.deleted_at || (restoredShift as any).deletedAt;
            expect(deletedAt).toBeNull();
        });


        it('Tests-ED-53-Cannot-restore-non-deleted-shift', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);

            const response = await request(app)
                .post(`/api/shifts/${shift.id}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Shift is not deleted');
        });


        it('Tests-ED-54-Restores-with-associated-data', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            
            // Create shift signals
            await ShiftSignal.create({
                shift_id: shift.id,
                driver_id: user.id,
                signal: 'pause',
                timestamp: new Date(Date.now() - 10000000)
            });

            // Delete and restore
            await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            const response = await request(app)
                .post(`/api/shifts/${shift.id}/restore`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);

            // Verify signals still exist
            const signals = await ShiftSignal.findAll({ where: { shift_id: shift.id } });
            expect(signals.length).toBeGreaterThan(0);
        });
    });


    describe('Authorization', () => {
        it('Tests-ED-55-Cannot-delete-other-driver-shift', async () => {
            const { user: driver1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
            const { user: driver2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');
            
            const shift = await createCompletedShift(driver2.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token1}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('Not authorized');
        });


        it('Tests-ED-56-Driver-can-delete-own-shift', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);

            const response = await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Shift deleted successfully');
        });


        it('Tests-ED-57-Cannot-restore-other-driver-shift', async () => {
            const { user: driver1, token: token1 } = await createAuthenticatedUser('driver1@test.com', 'driver1');
            const { user: driver2, token: token2 } = await createAuthenticatedUser('driver2@test.com', 'driver2');
            
            const shift = await createCompletedShift(driver2.id);

            // Driver 2 deletes their shift
            await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token2}`);

            // Driver 1 tries to restore it
            const response = await request(app)
                .post(`/api/shifts/${shift.id}/restore`)
                .set('Authorization', `Bearer ${token1}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('Not authorized');
        });
    });


    describe('Data Integrity', () => {
        it('Tests-ED-58-Preserves-shift-data-on-soft-delete', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            
            const originalData = {
                shift_start: shift.shift_start,
                shift_end: shift.shift_end,
                total_duration_ms: shift.total_duration_ms,
                work_time_ms: shift.work_time_ms
            };

            // Delete the shift
            await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Verify data is preserved
            const deletedShift = await Shift.findByPk(shift.id, { paranoid: false });
            expect(deletedShift!.shift_start).toEqual(originalData.shift_start);
            expect(deletedShift!.shift_end).toEqual(originalData.shift_end);
            expect(deletedShift!.total_duration_ms).toBe(originalData.total_duration_ms);
            expect(deletedShift!.work_time_ms).toBe(originalData.work_time_ms);
        });


        it('Tests-ED-59-Maintains-referential-integrity', async () => {
            const { user, token } = await createAuthenticatedUser();
            const shift = await createCompletedShift(user.id);
            
            // Create associated data
            const signal = await ShiftSignal.create({
                shift_id: shift.id,
                driver_id: user.id,
                signal: 'pause',
                timestamp: new Date(Date.now() - 10000000)
            });

            // Delete the shift
            await request(app)
                .delete(`/api/shifts/${shift.id}`)
                .set('Authorization', `Bearer ${token}`);

            // Verify signals still exist
            const existingSignal = await ShiftSignal.findByPk(signal.id);
            expect(existingSignal).toBeTruthy();
            expect(existingSignal!.shift_id).toBe(shift.id);
        });
    });
});