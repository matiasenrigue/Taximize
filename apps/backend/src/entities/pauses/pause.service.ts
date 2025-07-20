import { Pause } from './pause.model';
import { ShiftSignal } from '../shifts/shiftSignal.model';

export class PauseService {


    /**
     * Save a pause period when driver continues from pause
     */
    static async saveShiftPause(driverId: string): Promise<void> {
        
        // Get the last two signals (should be pause and continue)
        const signals = await ShiftSignal.findAll({
            where: { driver_id: driverId },
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
        // Get the last signal for this driver
        const lastSignal = await ShiftSignal.findOne({
            where: { driver_id: driverId },
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
                driver_id: driverId,
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

    /**
     * Calculate pause statistics for a shift
     */
    static async calculatePauseStats(shiftId: string): Promise<{
        totalPauseTime: number;
        numPauses: number;
        averagePauseDuration: number;
    }> {
        const pauses = await this.getPausesForShift(shiftId);
        
        if (pauses.length === 0) {
            return {
                totalPauseTime: 0,
                numPauses: 0,
                averagePauseDuration: 0
            };
        }

        const totalPauseTime = pauses.reduce((sum, pause) => sum + Number(pause.duration_ms), 0);
        const averagePauseDuration = Math.round(totalPauseTime / pauses.length);

        return {
            totalPauseTime,
            numPauses: pauses.length,
            averagePauseDuration
        };
    }
}