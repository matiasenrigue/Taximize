import { Pause } from './pause.model';
import { ShiftSignal } from '../shift-signals/shiftSignal.model';
import { ShiftService } from '../shifts/shift.service';

export class PauseService {


    /**
     * Save a pause period when driver continues from pause
     */
    static async saveShiftPause(driverId: string): Promise<void> {
        
        // Get active shift first
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (!activeShift) {
            throw new Error('No active shift found');
        }
        
        // Get the last two signals (should be pause and continue)
        const signals = await ShiftSignal.findAll({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']],
            limit: 2
        });

        if (signals.length < 2) {
            throw new Error('Not enough signals to create pause record');
        }

        const continueSignal = signals[0];
        const pauseSignal = signals[1];

        // Verify the signals are correct
        if (continueSignal.signal !== 'continue' || pauseSignal.signal !== 'pause') {
            throw new Error('Invalid signal sequence for pause record');
        }

        // Calculate pause duration
        const pauseDuration = continueSignal.timestamp.getTime() - pauseSignal.timestamp.getTime();

        // Create pause record
        await Pause.create({
            shift_id: continueSignal.shift_id,
            pause_start: pauseSignal.timestamp,
            pause_end: continueSignal.timestamp,
            duration_ms: pauseDuration
        });
    }


    
    /**
     * Get pause information for a driver
     */
    static async getPauseInfo(driverId: string): Promise<{
        isPaused: boolean;
        pauseStart: Date | null;
        lastPauseEnd: Date | null;
        pauseDuration: number | null;
    }> {
        // Get active shift first
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (!activeShift) {
            return {
                isPaused: false,
                pauseStart: null,
                lastPauseEnd: null,
                pauseDuration: null
            };
        }
        
        // Get the last signal for this driver
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

        const isPaused = lastSignal.signal === 'pause';
        let pauseStart = null;
        let pauseDuration = null;

        if (isPaused) {
            pauseStart = lastSignal.timestamp;
            // If currently paused, calculate current pause duration
            pauseDuration = Date.now() - pauseStart.getTime();
        }

        // Get the last pause end time (last continue signal)
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
     * Get all pauses for a shift
     */
    static async getPausesForShift(shiftId: string): Promise<Pause[]> {
        return await Pause.findAll({
            where: { shift_id: shiftId },
            order: [['pause_start', 'ASC']]
        });
    }


}