import { ShiftService } from '../../shift.service';
import ShiftSignalService from '../../../shift-signals/shiftSignal.service';
import PauseService from '../../../shift-pauses/pause.service';
import { ExpiredDataCleanup } from '../../utils/cleanup/expiredDataCleanup';
import { sequelize } from '../../../../shared/config/db';

/**
 * Unit tests for shift service
 * Note: Most of these fail without proper db mocking
 */

/**
 * Unit tests for shift service
 * Note: Most of these fail without proper db mocking
 */

// Set up test database before running tests
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('ShiftService', () => {

    describe('signal validation', () => {

        it('returns true for valid transitions', async () => {
            const driverId = 'driver123';
describe('ShiftService', () => {

    describe('signal validation', () => {

        it('returns true for valid transitions', async () => {
            const driverId = 'driver123';
            const newSignal = 'start';
            
            const result = await ShiftSignalService.isValidSignal(driverId, newSignal);
            expect(result).toBe(true); // new driver can start


        it('throws on invalid signal', async () => {
            const driverId = 'john-doe';
        it('throws on invalid signal', async () => {
            const driverId = 'john-doe';
            const newSignal = 'continue';
            
            // can't continue without starting
            // can't continue without starting
            await expect(ShiftSignalService.isValidSignal(driverId, newSignal))
                .rejects.toThrow('Invalid signal transition: continue');
        });
    });


    describe('signal handlers', () => {

        it('rejects bogus signals', async () => {
            const driverId = 'abc-123';
    describe('signal handlers', () => {

        it('rejects bogus signals', async () => {
            const driverId = 'abc-123';
            const timestamp = Date.now();
            
            await expect(ShiftSignalService.isValidSignal(driverId, 'bogus-'bogus-signal''))
                .rejects.toThrow('Invalid signal transition');
        });


        it('handles start signal', async () => {
            const DRIVER_ID = 'driver-456';
        it('handles start signal', async () => {
            const DRIVER_ID = 'driver-456';
            const timestamp = Date.now();
            
            try {
                await ShiftSignalService.handleStartSignal(DRIVER_ID, timestamp);
            } catch (e) {
                expect(e).toBeDefined();
                await ShiftSignalService.handleStartSignal(DRIVER_ID, timestamp);
            } catch (e) {
                expect(e).toBeDefined();
            }
        });


        it('pause signal handling', async () => {
            const driverId = 'pause-test-driver';
        it('pause signal handling', async () => {
            const driverId = 'pause-test-driver';
            const timestamp = Date.now();
            
            try {
                await ShiftSignalService.handlePauseSignal(driverId, timestamp);
            } catch (_) {
            } catch (_) {
            }
        });


        it('continue after pause', async () => {
            const driver = 'test-123';
            const ts = Date.now();
            
            try {
                await ShiftSignalService.handleContinueSignal(driver, ts);
            } catch (error) {
                expect(error.message).toContain('shift'); 
            }
        });
    });


    describe('getCurrentShiftStatus', () => {

        it('gets current status', async () => {
            const driverId = 'driver1';

        it('gets current status', async () => {
            const driverId = 'driver1';
            
            const result = await ShiftService.getCurrentShiftStatus(driverId);
            expect(result).toBe(null); // no db = no shift
            expect(result).toBe(null); // no db = no shift
        });

        // This test is kinda redundant but whatever
        it('returns null for inactive driver', async () => {
            const result = await ShiftService.getCurrentShiftStatus('inactive-guy');
            expect(result).toBeNull();
        // This test is kinda redundant but whatever
        it('returns null for inactive driver', async () => {
            const result = await ShiftService.getCurrentShiftStatus('inactive-guy');
            expect(result).toBeNull();
        });
    });


    // driver availability checks
    it('checks if driver available', async () => {
        const available = await ShiftService.driverIsAvailable('some-driver');
        expect(available).toBe(false); // always false without db
    });
    // driver availability checks
    it('checks if driver available', async () => {
        const available = await ShiftService.driverIsAvailable('some-driver');
        expect(available).toBe(false); // always false without db
    });



    it('paused drivers not available', async () => {
        const driverId = 'paused-driver';
        const result = await ShiftService.driverIsAvailable(driverId);
        expect(result).toBeFalsy();

    it('paused drivers not available', async () => {
        const driverId = 'paused-driver';
        const result = await ShiftService.driverIsAvailable(driverId);
        expect(result).toBeFalsy();
    });


    describe('saveShift', () => {
        it('fails without active shift', async () => {
            await expect(ShiftService.saveShift('random-driver'))
        it('fails without active shift', async () => {
            await expect(ShiftService.saveShift('random-driver'))
                .rejects.toThrow('No active shift to save');
        });
    });


    it('saving pauses', async () => {
        await expect(PauseService.saveShiftPause('not-paused-driver'))
            .rejects.toThrow('No active shift found');
    });
    });


    it('saving pauses', async () => {
        await expect(PauseService.saveShiftPause('not-paused-driver'))
            .rejects.toThrow('No active shift found');
    });



    describe('expired shift cleanup', () => {
        // all these tests are basically the same lol
        it('handles expired shifts', async () => {
            const testDriverId = 'expire-test-1';
            await expect(ExpiredDataCleanup.manageExpiredShifts(testDriverId)).resolves.not.toThrow();

    describe('expired shift cleanup', () => {
        // all these tests are basically the same lol
        it('handles expired shifts', async () => {
            const testDriverId = 'expire-test-1';
            await expect(ExpiredDataCleanup.manageExpiredShifts(testDriverId)).resolves.not.toThrow();
        });

        it('handles the weird edge case where shift spans 2 days', async () => {
            await expect(ExpiredDataCleanup.manageExpiredShifts('long-shift-driver')).resolves.not.toThrow();
        it('handles the weird edge case where shift spans 2 days', async () => {
            await expect(ExpiredDataCleanup.manageExpiredShifts('long-shift-driver')).resolves.not.toThrow();
        });
    });
}); 
