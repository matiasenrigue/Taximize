import { Pause } from './pause.model';
import { ShiftSignal } from '../shift-signals/shiftSignal.model';
import { ShiftService } from '../shifts/shift.service';

abstract class PauseService {

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

        if (signals.length < 2) {
            throw new Error('Not enough signals to create pause record');
        }

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
            duration_ms: pauseDuration
        });
    }


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

        const isPaused = lastSignal.signal === 'pause';
        let pauseStart = null;
        let pauseDuration = null;

        if (isPaused) {
            pauseStart = lastSignal.timestamp;
            pauseDuration = Date.now() - pauseStart.getTime();
        }

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

    static async getPausesForShift(shiftId: string): Promise<Pause[]> {
        return await Pause.findAll({
            where: { shift_id: shiftId },
            order: [['pause_start', 'ASC']]
        });
    }
}

export default PauseService;