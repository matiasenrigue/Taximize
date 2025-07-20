import { initializeAssociations } from '../../../../shared/config/associations';
import { RideService } from '../../ride.service';
import { ShiftService } from '../../../shifts/shift.service';
import Ride from '../../ride.model';
import Shift from '../../../shifts/shift.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';
import { ExpiredDataCleanup } from '../../../shifts/utils/cleanup/expiredDataCleanup';

TestHelpers.setupEnvironment();

// Common test coordinates
const DEFAULT_COORDS = {
    startLat: 53.349805,
    startLng: -6.260310,
    destLat: 53.359805,
    destLng: -6.270310,
    predictedScore: 0.75
};

beforeAll(async () => {
    initializeAssociations();
    await TestHelpers.setupDatabase();
});

afterEach(async () => {
    await TestHelpers.cleanupDatabase();
});

afterAll(async () => {
    await TestHelpers.closeDatabase();
});


describe('Ride Service Integration Tests', () => {

    describe('Service Layer Data Flow', () => {
        it('should correctly handle driver availability check through service layers', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Test driver availability through ShiftService
            const isAvailable = await ShiftService.driverIsAvailable(user.id);
            expect(isAvailable).toBe(true);

            // Test canStartRide through RideService
            const canStartResult = await RideService.canStartRide(user.id);
            expect(canStartResult.canStart).toBe(true);

            // Test hasActiveRide through RideService
            const hasActive = await RideService.hasActiveRide(user.id);
            expect(hasActive).toBe(false);
        });


        it('should correctly propagate state changes through service layers', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Initially should be able to start ride
            let canStartResult = await RideService.canStartRide(user.id);
            expect(canStartResult.canStart).toBe(true);

            // Start a ride
            const coords = {
                ...DEFAULT_COORDS,
                address: "Service Integration Test 1"
            };

            const rideResult = await RideService.startRide(user.id, shift.id, coords);
            expect(rideResult.rideId).toBeDefined();

            // Now should not be able to start another ride
            canStartResult = await RideService.canStartRide(user.id);
            expect(canStartResult.canStart).toBe(false);

            // Should have an active ride
            const hasActive = await RideService.hasActiveRide(user.id);
            expect(hasActive).toBe(true);
        });


        it('should handle service layer error propagation correctly', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();

            // No active shift scenario
            const canStartResult = await RideService.canStartRide(user.id);
            expect(canStartResult.canStart).toBe(false);

            // Attempt to start ride without shift should fail
            const coords = {
                ...DEFAULT_COORDS,
                address: "Service Integration Test 2"
            };

            await expect(RideService.startRide(user.id, 'fake-shift-id', coords))
                .rejects.toThrow('No active shift found');
        });
    });


    describe('Cross-Service Data Integrity', () => {
        it('should maintain data consistency across Ride and Shift services', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Start ride through RideService
            const coords = {
                ...DEFAULT_COORDS,
                address: "Service Integration Test 3"
            };

            const rideResult = await RideService.startRide(user.id, shift.id, coords);

            // Verify through RideService
            const rideStatus = await RideService.getRideStatus(user.id);
            expect(rideStatus).not.toBeNull();
            expect(rideStatus!.rideId).toBe(rideResult.rideId);

            // Verify through ShiftService that driver is still available but busy
            const isAvailable = await ShiftService.driverIsAvailable(user.id);
            expect(isAvailable).toBe(true); // Driver is available but has active ride

            // Verify data consistency in database
            const dbRide = await Ride.findByPk(rideResult.rideId);
            const dbShift = await Shift.findByPk(shift.id);
            
            expect(dbRide!.shift_id).toBe(dbShift!.id);
            expect(dbRide!.driver_id).toBe(dbShift!.driver_id);
        });


        it('should handle shift termination impact on ride services', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Start ride
            const coords = {
                ...DEFAULT_COORDS,
                address: "Service Integration Test 4"
            };

            const rideResult = await RideService.startRide(user.id, shift.id, coords);

            // Verify ride is active
            let rideStatus = await RideService.getRideStatus(user.id);
            expect(rideStatus).not.toBeNull();

            // End shift
            await shift.update({ shift_end: new Date() });

            // Ride status should throw error (no active shift)
            await expect(RideService.getRideStatus(user.id))
                .rejects.toThrow('No active shift found. Please start a shift before checking ride status.');

            // But ride should still exist in database
            const dbRide = await Ride.findByPk(rideResult.rideId);
            expect(dbRide).not.toBeNull();
            expect(dbRide!.end_time).toBeNull(); // Still active in DB
        });
    });


    describe('Service Layer Transaction Handling', () => {
        it('should handle concurrent ride start attempts correctly', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            const coords = {
                ...DEFAULT_COORDS,
                address: "Service Integration Test 5"
            };

            // Make concurrent ride start attempts
            const promises = Array.from({ length: 3 }, () =>
                RideService.startRide(user.id, shift.id, coords)
            );

            // Only one should succeed, others should fail
            const results = await Promise.allSettled(promises);
            
            const successful = results.filter(r => r.status === 'fulfilled');
            const failed = results.filter(r => r.status === 'rejected');

            expect(successful).toHaveLength(1);
            expect(failed).toHaveLength(2);

            // Verify database state
            const rides = await Ride.findAll({ where: { driver_id: user.id } });
            expect(rides).toHaveLength(1);
        });


        it('should handle ride end with proper data validation', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Start ride
            const coords = {
                ...DEFAULT_COORDS,
                address: "Service Integration Test 6"
            };

            const rideResult = await RideService.startRide(user.id, shift.id, coords);

            // Wait a bit to ensure timing calculation
            await new Promise(resolve => setTimeout(resolve, 100));

            // End ride
            const endResult = await RideService.endRide(rideResult.rideId, 1500, 5.2);

            expect(endResult.rideId).toBe(rideResult.rideId);
            expect(endResult.earningCents).toBe(1500);
            expect(endResult.distanceKm).toBe(5.2);
            expect(endResult.totalTimeMs).toBeGreaterThan(0);
            expect(endResult.earningPerMin).toBeGreaterThan(0);

            // Verify database state
            const dbRide = await Ride.findByPk(rideResult.rideId);
            expect(dbRide!.end_time).not.toBeNull();
            expect(dbRide!.earning_cents).toBe(1500);
            expect(dbRide!.distance_km).toBe(5.2);
        });
    });


    describe('Service Layer Edge Cases', () => {
        it('should handle malformed UUID inputs gracefully', async () => {
            const coords = {
                ...DEFAULT_COORDS,
                address: "Malformed UUID Test"
            };

            // Test with malformed driver ID
            await expect(RideService.startRide('invalid-uuid', 'another-invalid-uuid', coords))
                .rejects.toThrow();

            // Test with malformed ride ID for end ride
            await expect(RideService.endRide('invalid-uuid', 1500, 5.2))
                .rejects.toThrow();

            // Test with malformed driver ID for status
            await expect(RideService.getRideStatus('invalid-uuid'))
                .rejects.toThrow('No active shift found. Please start a shift before checking ride status.');
        });


        it('should handle coordinate validation through service layer', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Test invalid latitude
            const invalidLatCoords = {
                startLat: 95, // Invalid: > 90
                startLng: -6.260310,
                destLat: 53.359805,
                destLng: -6.270310,
                predictedScore: 0
            };

            await expect(RideService.startRide(user.id, shift.id, invalidLatCoords))
                .rejects.toThrow('Invalid latitude provided');

            // Test invalid longitude
            const invalidLngCoords = {
                startLat: 53.349805,
                startLng: -185, // Invalid: < -180
                destLat: 53.359805,
                destLng: -6.270310,
                predictedScore: 0
            };

            await expect(RideService.startRide(user.id, shift.id, invalidLngCoords))
                .rejects.toThrow('Invalid longitude provided');
        });


        it('should handle expired rides cleanup correctly', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Create an old ride (simulate 5 hours ago)
            const oldRide = await TestHelpers.createActiveRide(shift.id, user.id, {
                address: "Expired Ride Test Address",
                start_time: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
            });

            // Run expired rides cleanup
            await ExpiredDataCleanup.manageExpiredRides(user.id);

            // Verify old ride is now ended
            const updatedRide = await Ride.findByPk(oldRide.id);
            expect(updatedRide!.end_time).not.toBeNull();
            expect(updatedRide!.earning_cents).toBe(0);
            expect(updatedRide!.distance_km).toBe(0);
        });
    });


    describe('Service Layer Performance', () => {
        it('should handle multiple drivers efficiently', async () => {
            // Create multiple drivers with active shifts
            const drivers = [];
            for (let i = 0; i < 5; i++) {
                const { user } = await TestHelpers.createAuthenticatedUser(
                    `driver${i}@test.com`,
                    `driver${i}`
                );
                const shift = await TestHelpers.createActiveShift(user.id);
                drivers.push({ user, shift });
            }

            // Start rides for all drivers concurrently
            const ridePromises = drivers.map(({ user, shift }) =>
                RideService.startRide(user.id, shift.id, DEFAULT_COORDS)
            );

            const results = await Promise.all(ridePromises);

            // All should succeed
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.rideId).toBeDefined();
            });

            // Verify database state
            const totalRides = await Ride.count();
            expect(totalRides).toBe(5);
        });
    });
});