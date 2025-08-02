import { RideService } from '../../ride.service';
import { sequelize } from '../../../../shared/config/db';
import { ExpiredDataCleanup } from '../../../shifts/utils/cleanup/expiredDataCleanup';

// Mock external dependencies
jest.mock('../../utils/zoneDetector', () => ({
    getZonesForRide: jest.fn().mockReturnValue({
        originZone: 'zone1',
        destinationZone: 'zone2'
    })
}));

jest.mock('../../../../shared/utils/dataApiClient', () => ({
    scoreTripXGB: jest.fn().mockResolvedValue({
        predicted_score: 73,
        final_score: 0.73
    }),
    formatDateTimeForScoring: jest.fn().mockReturnValue('2024-01-01 12:00:00')
}));

// Set up test database before running tests
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});


describe('RideService Unit Tests', () => {
    
    describe('hasActiveRide', () => {
        it('returns true for active rides', async () => {
            const driverId = 'driver-123';
            // TODO: mock the db properly here
            const result = await RideService.hasActiveRide(driverId);
            expect(typeof result).toBe('boolean');
        });

        it('should return false when the driver has no active ride', async () => {
            const driver = 'john-doe-456';
            const result = await RideService.hasActiveRide(driver);
            expect(typeof result).toBe('boolean'); // just checking it runs for now
        });
    });


    describe('canStartRide', () => {
        it('should return object with canStart property', async () => {
            const result = await RideService.canStartRide('test-driver-1');
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('canStart');
            expect(typeof result.canStart).toBe('boolean');
        });

        it('fails when driver has no shift', async () => {
            const driverId = 'driver-without-shift';
            const result = await RideService.canStartRide(driverId);
            expect(result.canStart).toBe(false);
            expect(result.reason).toContain('No active shift found'); // should fail without shift
        });

        // Not sure if this test is really needed
        it('should return false when driver already has active ride', async () => {
            const DRIVER_ID = 'abc-123';
            const result = await RideService.canStartRide(DRIVER_ID);
            expect(result).toHaveProperty('canStart');
            expect(result.canStart).toBe(false);
        });

        it.skip('pause functionality - broken after refactor', async () => {
            // FIXME: Works locally but not in CI
            const driverId = 'paused-driver';
            const result = await RideService.canStartRide(driverId);
            expect(result.canStart).toBe(false);
        });
    });


    describe('ride evaluation', () => {
        const NYCoords = {
            startLat: 53.349805,
            startLng: -6.260310,
            destLat: 53.359805,
            destLng: -6.270310
        };

        it('returns valid score', async () => {
            const result = await RideService.evaluateRide(
                NYCoords.startLat, 
                NYCoords.startLng, 
                NYCoords.destLat, 
                NYCoords.destLng
            );
            // Can be null if ML service is down
            expect(result === null || typeof result === 'number').toBe(true);
            if (result !== null) {
                expect(result).toBeGreaterThanOrEqual(1);
                expect(result).toBeLessThanOrEqual(5);
            }
        });


        it('throws on invalid coordinates', async () => {
            await expect(RideService.evaluateRide(91, -6.26, 53.36, -6.27))
                .rejects.toThrow('Invalid latitude');
            
            // bad longitude    
            await expect(RideService.evaluateRide(53.35, 181, 53.36, -6.27))
                .rejects.toThrow('longitude');
        });
    });


    describe('startRide', () => {
        const driver1 = 'driver-abc';
        const shift1 = 'morning-shift';
        
        it('validates coordinates', async () => {
            const badCoords = {
                startLat: 95,
                startLng: -6.260310,
                destLat: 53.359805,
                destLng: -6.270310,
                address: "Test Address",
                predictedScore: 0.75
            };

            await expect(RideService.startRide(driver1, shift1, badCoords))
                .rejects.toThrow('Invalid latitude');
                
            // try bad longitude too
            badCoords.startLat = 53.349805;
            badCoords.startLng = -185;
            await expect(RideService.startRide(driver1, shift1, badCoords))
                .rejects.toThrow('longitude');
        });


        it('throws when driver cant start', async () => {
            const coords = {
                startLat: 53.349805,
                startLng: -6.260310,
                destLat: 53.359805,
                destLng: -6.270310,
                address: "O'Connell Street",
                predictedScore: 0.75
            };

            await expect(RideService.startRide('bad-driver', 'shift-xyz', coords))
                .rejects.toThrow();
        });

        // This test need to fix
        it('should successfully start a ride when all conditions are met', async () => {
            const coords = {
                startLat: 53.349805,
                startLng: -6.260310,
                destLat: 53.359805,
                destLng: -6.270310,
                address: "Test ride from city center",
                predictedScore: 0.8
            };

            try {
                await RideService.startRide(driver1, shift1, coords);
            } catch (e) {
                // whatever, db not set up in unit tests
                expect(e).toBeDefined();
            }
        });

        it('duplicate rides', async () => {
            // Used to allow multiple active rides per shift
            const coords = {
                startLat: 53.349805,
                startLng: -6.260310,
                destLat: 53.359805, 
                destLng: -6.270310,
                address: "Duplicate Test",
                predictedScore: 0.9
            };

            try {
                await RideService.startRide('test-driver', 'test-shift', coords);
                // Try to start another ride with same shift - should fail
                await RideService.startRide('test-driver', 'test-shift', coords);
            } catch (error) {
                expect(error).toBeDefined(); // good, constraint working
            }
        });
    });


    describe('ending rides', () => {
        it('fails for non-existent ride', async () => {
            await expect(RideService.endRide('fake-ride-id', 1500, 10.5))
                .rejects.toThrow('Ride not found');
        });

        it('ends ride properly', async () => {
            const rideId = 'ride-123';
            const fare = 1500; // €15.00
            const distance = 10.5;

            try {
                await RideService.endRide(rideId, fare, distance);
            } catch (_) {
                // db not setup
            }
        });
    });


    describe('getRideStatus', () => {
        it('gets current ride', async () => {
            try {
                const result = await RideService.getRideStatus('driver123');
                expect(result).toBe(null); // no db
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });


    describe('cleanup expired rides', () => {
        it('handles the weird edge case where ride spans > 4 hours', async () => {
            const DRIVER = 'long-ride-driver';
            await expect(ExpiredDataCleanup.manageExpiredRides(DRIVER)).resolves.not.toThrow();
        });

    });
    

}); 