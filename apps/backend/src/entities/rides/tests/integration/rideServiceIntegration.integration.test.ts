import { initializeAssociations } from '../../../../shared/config/associations';
import { RideService } from '../../ride.service';
import { ShiftService } from '../../../shifts/shift.service';
import Ride from '../../ride.model';
import Shift from '../../../shifts/shift.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';
import { ExpiredDataCleanup } from '../../../shifts/utils/cleanup/expiredDataCleanup';

TestHelpers.setupEnvironment();

// Dublin coordinates I use for testing
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


describe('RideService Integration', () => {

    describe('Service Layer Data Flow', () => {

        it('driver availability flows through services', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            const isAvailable = await ShiftService.driverIsAvailable(user.id);
            expect(isAvailable).toBe(true); // has shift

            const canStartResult = await RideService.canStartRide(user.id);
            expect(canStartResult.canStart).toBe(true);

            // no ride yet
            const hasActive = await RideService.hasActiveRide(user.id);
            expect(hasActive).toBe(false);
        });


        it('state changes propagate correctly', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // can start initially
            let canStart = await RideService.canStartRide(user.id);
            expect(canStart.canStart).toBe(true);

            const rideResult = await RideService.startRide(user.id, shift.id, {
                ...DEFAULT_COORDS,
                address: "Temple Bar"
            });
            expect(rideResult.rideId).toBeDefined();

            // Now blocked
            canStart = await RideService.canStartRide(user.id);
            expect(canStart.canStart).toBe(false); // already has ride

            const hasActive = await RideService.hasActiveRide(user.id);
            expect(hasActive).toBe(true);
        });


        it('errors bubble up properly', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();

            // no shift = no ride
            const canStart = await RideService.canStartRide(user.id);
            expect(canStart.canStart).toBe(false);

            await expect(RideService.startRide(user.id, 'fake-shift-id', {
                ...DEFAULT_COORDS,
                address: "Should fail"
            })).rejects.toThrow('No active shift');
        });
    });


    describe('data consistency', () => {

        it('ride and shift data stays in sync', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            const rideResult = await RideService.startRide(user.id, shift.id, {
                ...DEFAULT_COORDS,
                address: "Phoenix Park"
            });

            // check through ride service
            const status = await RideService.getRideStatus(user.id);
            expect(status).not.toBeNull();
            expect(status!.rideId).toBe(rideResult.rideId);

            // driver still "available" even with ride
            const isAvailable = await ShiftService.driverIsAvailable(user.id);
            expect(isAvailable).toBe(true); // has shift, just busy

            // Verify db consistency
            const dbRide = await Ride.findByPk(rideResult.rideId);
            const dbShift = await Shift.findByPk(shift.id);
            
            expect(dbRide!.shift_id).toBe(dbShift!.id);
            expect(dbRide!.driver_id).toBe(user.id); // all linked properly
        });


        it('ending shift affects ride status check', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            const rideResult = await RideService.startRide(user.id, shift.id, {
                ...DEFAULT_COORDS,
                address: "Howth"
            });

            // ride exists
            let status = await RideService.getRideStatus(user.id);
            expect(status).not.toBeNull();

            // Clock out
            await shift.update({ shift_end: new Date() });

            // Now fails - no active shift
            await expect(RideService.getRideStatus(user.id))
                .rejects.toThrow('No active shift');

            // ride still in DB though
            const dbRide = await Ride.findByPk(rideResult.rideId);
            expect(dbRide).not.toBeNull();
            expect(dbRide!.end_time).toBeNull(); // orphaned active ride!
        });
    });



    describe('edge cases', () => {

        it('cleans up ancient rides', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // Create zombie ride from 5 hours ago
            const oldRide = await TestHelpers.createActiveRide(shift.id, user.id, {
                address: "Forgotten ride",
                start_time: new Date(Date.now() - 5 * 60 * 60 * 1000) // ancient history
            });

            await ExpiredDataCleanup.manageExpiredRides(user.id);

            // Should be force-ended
            const updated = await Ride.findByPk(oldRide.id);
            expect(updated!.end_time).not.toBeNull(); // ended
            expect(updated!.earning_cents).toBe(0); // no money
            expect(updated!.distance_km).toBe(0); // no distance
        });
    });



});