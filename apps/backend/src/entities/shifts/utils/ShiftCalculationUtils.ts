import { Shift } from '../shift.model';
import { Ride } from '../../rides/ride.model';
import { Pause } from '../pause.model';

import { camelToSnake } from '../../../shared/utils/caseTransformer';

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

type UpdateMode = 'full' | 'onlyRideData' | 'onlyPauseData';

export class ShiftCalculationUtils {
    
    /**
     * Calculate pauses data for a shift
     * @param shift - The shift instance
     * @param pauses - Array of pauses for the shift
     * @returns Calculated pause statistics
     */
    static async calculatePausesData(shift: Shift, pauses: Pause[]): Promise<PausesData> {
        if (!pauses || pauses.length === 0) {
            return {
                totalBreakTimeMs: 0,
                numberOfBreaks: 0,
                averageBreakDurationMs: 0
            };
        }

        // Filter pauses that fall within the shift timeframe
        const validPauses = pauses.filter(pause => {
            const pauseStart = pause.pause_start;
            const pauseEnd = pause.pause_end;
            
            // Only include pauses that are within shift boundaries
            return pauseStart >= shift.shift_start && 
                   (!shift.shift_end || pauseEnd <= shift.shift_end);
        });

        if (validPauses.length === 0) {
            return {
                totalBreakTimeMs: 0,
                numberOfBreaks: 0,
                averageBreakDurationMs: 0 // avoid division by zero
            };
        }

        // Calculate total break time
        const totalBreakTimeMs = validPauses.reduce((total, pause) => {
            return total + pause.duration_ms;
        }, 0);

        const numberOfBreaks = validPauses.length;
        const averageBreakDurationMs = totalBreakTimeMs / numberOfBreaks;

        return {
            totalBreakTimeMs,
            numberOfBreaks,
            averageBreakDurationMs
        };
    }

    /**
     * Calculate rides data for a shift
     * @param shift - The shift instance
     * @param rides - Array of rides for the shift
     * @returns Calculated ride statistics
     */
    static async calculateRidesData(shift: Shift, rides: Ride[]): Promise<RidesData> {
        if (!rides || rides.length === 0) {
            return {
                totalEarningsCents: 0,
                totalDistanceKm: 0,
                numberOfRides: 0
            };
        }

        // Filter non-deleted rides with earnings > 0
        const validRides = rides.filter(ride => !ride.deleted_at && (ride.earning_cents || 0) > 0);

        // Calculate totals
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
     * Fill shift data with calculated values
     * @param shift - The shift instance to update
     * @param mode - Update mode: 'full', 'onlyRideData', or 'onlyPauseData'
     * @param pauses - Array of pauses (optional if mode is 'onlyRideData')
     * @param rides - Array of rides (optional if mode is 'onlyPauseData')
     * @returns Object with calculated data that should be updated
     */
    static async fillData(
        shift: Shift, 
        mode: UpdateMode = 'full',
        pauses?: Pause[],
        rides?: Ride[]
    ): Promise<Partial<ShiftData>> {
        const updateData: Partial<ShiftData> = {};

        // Calculate total duration if shift has ended
        if (shift.shift_end) {
            const totalDurationMs = shift.shift_end.getTime() - shift.shift_start.getTime();
            updateData.totalDurationMs = totalDurationMs;
        }

        // Calculate pause data if not in 'onlyRideData' mode
        if (mode !== 'onlyRideData' && pauses) {
            const pauseData = await this.calculatePausesData(shift, pauses);
            updateData.breakTimeMs = pauseData.totalBreakTimeMs;
            updateData.numBreaks = pauseData.numberOfBreaks;

            // Calculate work time if we have total duration
            if (updateData.totalDurationMs !== undefined) {
                updateData.workTimeMs = updateData.totalDurationMs - pauseData.totalBreakTimeMs;
            }
        }

        // Calculate ride data if not in 'onlyPauseData' mode
        if (mode !== 'onlyPauseData' && rides) {
            const rideData = await this.calculateRidesData(shift, rides);
            updateData.totalEarningsCents = rideData.totalEarningsCents;
            updateData.totalDistanceKm = rideData.totalDistanceKm;
            updateData.numberOfRides = rideData.numberOfRides;
        }

        return updateData;
    }

    /**
     * Helper method to update shift with calculated data
     * @param shift - The shift instance to update
     * @param mode - Update mode
     * @param pauses - Array of pauses
     * @param rides - Array of rides
     * @returns Updated shift instance
     */
    static async updateShiftCalculations(
        shift: Shift,
        mode: UpdateMode = 'full',
        pauses?: Pause[],
        rides?: Ride[]
    ): Promise<Shift> {
        const calculatedData = await this.fillData(shift, mode, pauses, rides);
        
        // Map the calculated data to the shift model fields
        const updateFields: any = {};

        for (const field in calculatedData) {
            const key = field as keyof ShiftData;
            // field names in the model are snake_case
            if (calculatedData[key] !== undefined) {
                updateFields[camelToSnake(field)] = calculatedData[key];
            }
        }


        // Update the shift with calculated values
        await shift.update(updateFields);
        
        
        return shift;
    }
}