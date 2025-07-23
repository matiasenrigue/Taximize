import { Shift } from '../shifts/shift.model';
import { ShiftRepository } from '../shifts/shift.repository';
import { RideRepository } from '../rides/ride.repository';
import { Ride } from '../rides/ride.model';
import { 
    generateDateArray, 
    isSameDay, 
    getDayNumber, 
    formatDuration, 
    formatDate,
    formatDateTimeCompact 
} from './utils/dateHelpers';
import { formatCurrency, centsToDecimal } from './utils/currencyHelpers';
import { 
    generateEarningsBreakdown, 
    calculateTotalEarnings,
    calculateWorkTimeByDate,
    generateWorkTimeBreakdown 
} from './utils/statisticsHelpers';

export class StatsService {
    
    // Returns shifts grouped by day with ride information for calendar view
    static async getShiftsForDateRange(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
        // Get all shifts in the date range with their associated rides
        const shifts = await ShiftRepository.findShiftsInDateRange(driverId, startDate, endDate, true);
        
        // Generate array of all dates in the range
        const dateArray = generateDateArray(startDate, endDate);
        
        // Group shifts by date
        const shiftsByDate = new Map<string, any[]>();
        
        shifts.forEach(shift => {
            const dateKey = formatDate(new Date(shift.shift_start));
            if (!shiftsByDate.has(dateKey)) {
                shiftsByDate.set(dateKey, []);
            }
            shiftsByDate.get(dateKey)!.push(shift);
        });
        
        // Build response with each day showing if it has rides and listing all shifts
        return dateArray.map(date => {
            const dateKey = formatDate(date);
            const dayShifts = shiftsByDate.get(dateKey) || [];
            
            // Check if any shift on this day has rides
            const hasRide = dayShifts.some(shift => 
                (shift as any).rides && (shift as any).rides.length > 0
            );
            
            return {
                day: date.toISOString(),
                hasRide,
                shifts: dayShifts.map(shift => ({
                    id: shift.id,
                    startDate: formatDateTimeCompact(new Date(shift.shift_start)),
                    endDate: shift.shift_end ? formatDateTimeCompact(new Date(shift.shift_end)) : 'ongoing',
                    stats: {
                        totalEarnings: centsToDecimal(shift.total_earnings_cents || 0),
                        totalDistance: shift.total_distance_km || 0,
                        numberOfRides: shift.number_of_rides || 0,
                        workTime: shift.work_time_ms ? Math.round(shift.work_time_ms / 1000 / 60) : 0, // in minutes
                        breakTime: shift.break_time_ms ? Math.round(shift.break_time_ms / 1000 / 60) : 0 // in minutes
                    },
                    rides: ((shift as any).rides || []).map((ride: any) => ({
                        id: ride.id,
                        startDate: formatDateTimeCompact(new Date(ride.start_time)),
                        endDate: ride.end_time ? formatDateTimeCompact(new Date(ride.end_time)) : 'ongoing',
                        from: ride.address || 'Unknown location',
                        to: `${ride.destination_latitude}, ${ride.destination_longitude}`,
                        duration: ride.end_time 
                            ? formatDuration(new Date(ride.start_time), new Date(ride.end_time))
                            : 'In progress',
                        fare: ride.earning_cents !== null 
                            ? formatCurrency(ride.earning_cents)
                            : 'Not available',
                        predictedScore: ride.predicted_score,
                        distanceKm: ride.distance_km || 0,
                        farePerMinute: ride.earning_per_min !== null
                            ? formatCurrency(ride.earning_per_min)
                            : 'Not available'
                    }))
                }))
            };
        });
    }

    // Returns all shifts that contain rides on a specific weekday (e.g., all Monday rides)
    static async getRidesByDayOfWeek(driverId: string, dayOfWeek: string): Promise<any[]> {
        const dayNumber = getDayNumber(dayOfWeek);
        
        if (dayNumber === undefined) {
            throw new Error('Invalid day of week');
        }
        
        // Get all rides for the day of week
        const rides = await RideRepository.findRidesByDayOfWeek(driverId, dayNumber);
        
        // Get unique shift IDs from rides
        const shiftIds = [...new Set(rides.map(ride => ride.shift_id))];
        
        // Fetch all related shifts with their rides
        const shifts = await Shift.findAll({
            where: { 
                id: shiftIds 
            },
            include: [{
                model: Ride,
                as: 'rides',
                where: {
                    driver_id: driverId
                },
                required: false
            }]
        });
        
        // Map shifts with their rides filtered by day of week
        return shifts.map(shift => ({
            id: shift.id,
            startDate: formatDateTimeCompact(new Date(shift.shift_start)),
            endDate: shift.shift_end ? formatDateTimeCompact(new Date(shift.shift_end)) : 'ongoing',
            stats: {
                totalEarnings: centsToDecimal(shift.total_earnings_cents || 0),
                totalDistance: shift.total_distance_km || 0,
                numberOfRides: shift.number_of_rides || 0,
                workTime: shift.work_time_ms ? Math.round(shift.work_time_ms / 1000 / 60) : 0, // in minutes
                breakTime: shift.break_time_ms ? Math.round(shift.break_time_ms / 1000 / 60) : 0 // in minutes
            },
            rides: ((shift as any).rides || [])
                .filter((ride: any) => new Date(ride.start_time).getDay() === dayNumber)
                .map((ride: any) => ({
                    id: ride.id,
                    startDate: formatDateTimeCompact(new Date(ride.start_time)),
                    endDate: ride.end_time ? formatDateTimeCompact(new Date(ride.end_time)) : 'ongoing',
                    from: ride.address || 'Unknown location',
                    to: `${ride.destination_latitude}, ${ride.destination_longitude}`,
                    duration: ride.end_time 
                        ? formatDuration(new Date(ride.start_time), new Date(ride.end_time))
                        : 'In progress',
                    fare: ride.earning_cents !== null 
                        ? formatCurrency(ride.earning_cents)
                        : 'Not available',
                    predictedScore: ride.predicted_score,
                    distanceKm: ride.distance_km || 0,
                    farePerMinute: ride.earning_per_min !== null
                        ? formatCurrency(ride.earning_per_min)
                        : 'Not available'
                }))
        }));
    }

    // Aggregates earnings data with breakdown by day (weekly shows Mon-Sun, monthly shows 1-31)
    static async getEarningsStatistics(
        driverId: string, 
        view: 'weekly' | 'monthly', 
        startDate: Date, 
        endDate: Date
    ): Promise<any> {
        // Get aggregated earnings data
        const earningsData = await RideRepository.aggregateEarningsByDate(
            driverId,
            startDate,
            endDate
        );
        
        // Calculate total earnings
        const totalEarnings = calculateTotalEarnings(earningsData);
        
        // Generate breakdown
        const breakdown = generateEarningsBreakdown(view, startDate, endDate, earningsData);
        
        return {
            totalEarnings,
            view,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            breakdown
        };
    }

    // Calculates work hours split between active rides and waiting time
    static async getWorkTimeStatistics(
        driverId: string,
        view: 'weekly' | 'monthly',
        startDate: Date,
        endDate: Date
    ): Promise<any> {
        // Get all shifts in the date range with their associated rides
        const shifts = await ShiftRepository.findShiftsInDateRange(driverId, startDate, endDate, true);
        
        // Extract all rides from shifts
        const rides = shifts.flatMap(shift => (shift as any).rides || []);
        
        // Calculate work time by date
        const workTimeByDate = calculateWorkTimeByDate(rides);
        
        // Generate breakdown
        const breakdown = generateWorkTimeBreakdown(view, startDate, endDate, workTimeByDate);
        
        return {
            view,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            breakdown
        };
    }
}