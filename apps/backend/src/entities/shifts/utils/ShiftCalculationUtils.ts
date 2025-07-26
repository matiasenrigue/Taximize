import { Shift } from '../shift.model';
import { Ride } from '../../rides/ride.model';
import { Pause } from '../../shift-pauses/pause.model';

import { camelToSnake } from '../../../shared/utils/caseTransformer';
import { ensureBigintSafe } from '../../../shared/utils/bigintSafety';

interface PausesData {
    totalBreakTimeMs: number;
    numberOfBreaks: number;
    averageBreakDurationMs: number;
}

interface RidesData {
    totalEarningsCents: number;
    totalDistanceKm: number;
    numberOfRides: number;
}

interface ShiftData {
    totalDurationMs: number;
    workTimeMs: number;
    breakTimeMs: number;
    numBreaks: number;
    avgBreakMs: number;
    totalEarningsCents?: number; 
    totalDistanceKm?: number;
    numberOfRides?: number;
}


// 'full': Calculate all metrics (pauses and rides)
// 'onlyRideData': Only calculate ride-related metrics
// 'onlyPauseData': Only calculate pause-related metrics
type UpdateMode = 'full' | 'onlyRideData' | 'onlyPauseData';



export class ShiftCalculationUtils {
    
    /**
     * Calculate break time stats for shift.
     * Only counts pauses within shift boundaries.
     * @returns PausesData object with break time stats
     */
    static async calculatePausesData(shift: Shift, pauses: Pause[]): Promise<PausesData> {
        if (!pauses || pauses.length === 0) {
            return {
                totalBreakTimeMs: 0,
                numberOfBreaks: 0,
                averageBreakDurationMs: 0
            };
        }

        // Only count pauses during this shift
        const validPauses = pauses.filter(pause => {
            const pauseStart = pause.pause_start;
            const pauseEnd = pause.pause_end;
            
            return pauseStart >= shift.shift_start && 
                   (!shift.shift_end || pauseEnd <= shift.shift_end);
        });

        if (validPauses.length === 0) {
            return {
                totalBreakTimeMs: 0,
                numberOfBreaks: 0,
                averageBreakDurationMs: 0
            };
        }

        const totalBreakTimeMs = validPauses.reduce((total, pause) => {
            return total + pause.duration_ms;
        }, 0);

        const numberOfBreaks = validPauses.length;
        const averageBreakDurationMs = numberOfBreaks > 0 ? Math.floor(totalBreakTimeMs / numberOfBreaks) : 0;

        return {
            totalBreakTimeMs: ensureBigintSafe(totalBreakTimeMs, 'totalBreakTimeMs') || 0,
            numberOfBreaks,
            averageBreakDurationMs: ensureBigintSafe(averageBreakDurationMs, 'averageBreakDurationMs') || 0
        };
    }



    /**
     * Calculate earnings and distance for shift.
     * Excludes deleted rides and zero-earning rides.
     * @returns RidesData object with earnings and distance stats
     */
    static async calculateRidesData(shift: Shift, rides: Ride[]): Promise<RidesData> {
        if (!rides || rides.length === 0) {
            return {
                totalEarningsCents: 0,
                totalDistanceKm: 0,
                numberOfRides: 0
            };
        }

        // Only paying rides count
        const validRides = rides.filter(ride => !ride.deleted_at && (ride.earning_cents || 0) > 0);

        const totalEarningsCents = validRides.reduce((total, ride) => {
            return total + (ride.earning_cents || 0);
        }, 0);

        const totalDistanceKm = validRides.reduce((total, ride) => {
            return total + (ride.distance_km || 0);
        }, 0);

        return {
            totalEarningsCents,
            totalDistanceKm,
            numberOfRides: validRides.length
        };
    }



    /**
     * Compute shift metrics based on mode.
     * @param mode 'full' | 'onlyRideData' | 'onlyPauseData'
     * @returns Calculated metrics object
     */
    static async fillData(
        shift: Shift, 
        mode: UpdateMode = 'full',
        pauses?: Pause[],
        rides?: Ride[]
    ): Promise<Partial<ShiftData>> {
        const updateData: Partial<ShiftData> = {};

        if (shift.shift_end) {
            const totalDurationMs = shift.shift_end.getTime() - shift.shift_start.getTime();
            const safeDuration = ensureBigintSafe(totalDurationMs, 'totalDurationMs');
            if (safeDuration !== null) {
                updateData.totalDurationMs = safeDuration;
            }
        }

        if (mode !== 'onlyRideData' && pauses) {
            const pauseData = await this.calculatePausesData(shift, pauses);
            updateData.breakTimeMs = pauseData.totalBreakTimeMs;
            updateData.numBreaks = pauseData.numberOfBreaks;
            updateData.avgBreakMs = pauseData.averageBreakDurationMs;

            // Work time = total - breaks
            if (updateData.totalDurationMs !== undefined) {
                const workTime = updateData.totalDurationMs - pauseData.totalBreakTimeMs;
                const safeWorkTime = ensureBigintSafe(workTime, 'workTimeMs');
                if (safeWorkTime !== null) {
                    updateData.workTimeMs = safeWorkTime;
                }
            }
        }

        if (mode !== 'onlyPauseData' && rides) {
            const rideData = await this.calculateRidesData(shift, rides);
            updateData.totalEarningsCents = rideData.totalEarningsCents;
            updateData.totalDistanceKm = rideData.totalDistanceKm;
            updateData.numberOfRides = rideData.numberOfRides;
        }

        return updateData;
    }


    
    /**
     * Update shift record with calculated stats.
     * Converts camelCase fields to snake_case for DB.
     * @returns Updated Shift instance
     */
    static async updateShiftCalculations(
        shift: Shift,
        mode: UpdateMode = 'full',
        pauses?: Pause[],
        rides?: Ride[]
    ): Promise<Shift> {
        const calculatedData = await this.fillData(shift, mode, pauses, rides);
        
        const updateFields: any = {};

        for (const field in calculatedData) {
            const key = field as keyof ShiftData;
            // DB uses snake_case
            if (calculatedData[key] !== undefined) {
                updateFields[camelToSnake(field)] = calculatedData[key];
            }
        }


        await shift.update(updateFields);
        
        
        return shift;
    }
}