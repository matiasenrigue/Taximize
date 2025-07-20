import { ShiftCalculator } from '../../utils/shiftCalculator';
import { ShiftCalculatorTestUtils } from '../utils/shiftCalculator.testUtils';


describe('ShiftCalculator Unit Tests', () => {
    beforeEach(() => {
        // Clear pause data before each test
        ShiftCalculatorTestUtils.clearPauseData();
    });


    describe('computeBreaks', () => {
        it('should compute break statistics from shift pauses', () => {
            // Test that computeBreaks computes break statistics from shift pauses
            const shiftStart = new Date('2024-01-01T09:00:00Z');
            const shiftEnd = new Date('2024-01-01T17:00:00Z');
            const driverId = 'test-driver-1';

            // Add some pause data for testing
            const pauses = [
                { start: new Date('2024-01-01T12:00:00Z'), end: new Date('2024-01-01T12:30:00Z') }, // 30 min break
                { start: new Date('2024-01-01T15:00:00Z'), end: new Date('2024-01-01T15:15:00Z') }  // 15 min break
            ];
            ShiftCalculatorTestUtils.addPauseData(driverId, pauses);

            const result = ShiftCalculator.computeBreaks(shiftStart, shiftEnd, pauses);

            expect(result).toBeDefined();
            expect(result.numberOfBreaks).toBe(2);
            expect(result.totalBreakTimeMs).toBe(45 * 60 * 1000); // 45 minutes
            expect(result.averageBreakDurationMs).toBe(22.5 * 60 * 1000); // 22.5 minutes
        });


        it('should return correct break statistics when no pauses exist', () => {
            // Test that computeBreaks returns correct break statistics when no pauses exist
            const shiftStart = new Date('2024-01-01T09:00:00Z');
            const shiftEnd = new Date('2024-01-01T17:00:00Z');
            const driverId = 'test-driver-2';

            const result = ShiftCalculator.computeBreaks(shiftStart, shiftEnd, []);

            expect(result).toBeDefined();
            expect(result.numberOfBreaks).toBe(0);
            expect(result.totalBreakTimeMs).toBe(0);
            expect(result.averageBreakDurationMs).toBe(0);
        });
    });


    describe('computeWorkTime', () => {
        it('should calculate work time by subtracting break time from total duration', () => {
            // Test that computeWorkTime calculates work time by subtracting break time from total duration
            const totalDurationMs = 8 * 60 * 60 * 1000; // 8 hours
            const breakTimeMs = 60 * 60 * 1000; // 1 hour
            
            const result = ShiftCalculator.computeWorkTime(totalDurationMs, breakTimeMs);
            
            expect(result).toBe(7 * 60 * 60 * 1000); // 7 hours
        });


        it('should return total duration when no break time', () => {
            // Test that computeWorkTime returns total duration when no break time
            const totalDurationMs = 8 * 60 * 60 * 1000; // 8 hours
            const breakTimeMs = 0;
            
            const result = ShiftCalculator.computeWorkTime(totalDurationMs, breakTimeMs);
            
            expect(result).toBe(totalDurationMs);
        });
    });
}); 