import { Pause } from './pause.model';
import { ShiftSignal } from '../shift-signals/shiftSignal.model';
import { ShiftService } from '../shifts/shift.service';
import { ensureBigintSafe } from '../../shared/utils/bigintSafety';

/**
 * Service layer for managing shift pause operations.
 * 
 * Handles the creation and retrieval of pause records based on shift signals.
 * Works in conjunction with ShiftSignalService to track when drivers
 * take breaks during their shifts.
 */
abstract class PauseService {

    /**
     * Creates a pause record after a driver resumes work.
     * 
     * This method is called when a 'continue' signal is received.
     * It looks back at the previous 'pause' signal to calculate
     * the pause duration and create a complete pause record.
     * 
     * @param driverId - The unique identifier of the driver
     * @throws Error if no active shift found or invalid signal sequence
     */
    static async saveShiftPause(driverId: string): Promise<void> {
        
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (!activeShift) {
            throw new Error('No active shift found');
        }
        
        const signals = await ShiftSignal.findAll({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']],
            limit: 2
        });

        // Need at least a pause and continue signal to create a pause record
        if (signals.length < 2) {
            throw new Error('Not enough signals to create pause record');
        }

        // Most recent signal should be 'continue', previous should be 'pause'
        const continueSignal = signals[0];
        const pauseSignal = signals[1];

        if (continueSignal.signal !== 'continue' || pauseSignal.signal !== 'pause') {
            throw new Error('Invalid signal sequence for pause record');
        }

        const pauseDuration = continueSignal.timestamp.getTime() - pauseSignal.timestamp.getTime();

        await Pause.create({
            shift_id: continueSignal.shift_id,
            pause_start: pauseSignal.timestamp,
            pause_end: continueSignal.timestamp,
            duration_ms: ensureBigintSafe(pauseDuration, 'pause.duration_ms')
        });
    }


    /**
     * Retrieves current pause status and information for a driver.
     * 
     * Provides real-time pause information including:
     * - Whether the driver is currently paused
     * - When the current pause started (if paused)
     * - When the last pause ended
     * - Current pause duration (if paused)
     * 
     * @param driverId - The unique identifier of the driver
     * @returns Object containing pause status and timing information
     */
    static async getPauseInfo(driverId: string): Promise<any> {
        
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (!activeShift) {
            return {
                isPaused: false,
                pauseStart: null,
                lastPauseEnd: null,
                pauseDuration: null
            };
        }
        
        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        if (!lastSignal) {
            return {
                isPaused: false,
                pauseStart: null,
                lastPauseEnd: null,
                pauseDuration: null
            };
        }

        // Check if driver is currently paused based on last signal
        const isPaused = lastSignal.signal === 'pause';
        let pauseStart = null;
        let pauseDuration = null;

        if (isPaused) {
            pauseStart = lastSignal.timestamp;
            // Calculate how long they've been paused (in milliseconds)
            pauseDuration = Date.now() - pauseStart.getTime();
        }

        // Find the most recent continue signal to determine last pause end
        const lastContinue = await ShiftSignal.findOne({
            where: { 
                shift_id: activeShift.id,
                signal: 'continue'
            },
            order: [['timestamp', 'DESC']]
        });

        return {
            isPaused,
            pauseStart,
            lastPauseEnd: lastContinue ? lastContinue.timestamp : null,
            pauseDuration
        };
    }

    /**
     * Retrieves all pause records for a specific shift.
     * 
     * Returns pauses in chronological order, useful for calculating
     * total break time and analyzing pause patterns within a shift.
     * 
     * @param shiftId - The unique identifier of the shift
     * @returns Array of pause records sorted by start time
     */
    static async getPausesForShift(shiftId: string): Promise<Pause[]> {
        return await Pause.findAll({
            where: { shift_id: shiftId },
            order: [['pause_start', 'ASC']]
        });
    }
}

export default PauseService;