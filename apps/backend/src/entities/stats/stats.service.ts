import { Shift } from '../shifts/shift.model';
import { ShiftRepository } from '../shifts/shift.repository';
import { RideRepository } from '../rides/ride.repository';
import { 
    generateDateArray, 
    isSameDay, 
    getDayNumber, 
    formatDuration, 
    formatDate,
    formatDateTimeCompact 
} from '../../utils/dateHelpers';
import { formatCurrency, centsToDecimal } from '../../utils/currencyHelpers';
import { 
    generateEarningsBreakdown, 
    calculateTotalEarnings,
    calculateWorkTimeByDate,
    generateWorkTimeBreakdown 
} from './utils/statisticsHelpers';

export class StatsService {
    static async getShiftsForDateRange(driverId: string, startDate: Date, endDate: Date): Promise<any[]> {
        // Get all shifts in the date range
        const shifts = await ShiftRepository.findShiftsInDateRange(driverId, startDate, endDate);
        
        // Get all rides in the date range
        const rides = await RideRepository.findRidesInDateRange(driverId, startDate, endDate);
        
        // Generate array of all dates in the range
        const dateArray = generateDateArray(startDate, endDate);
        
        // Group shifts and rides by date
        const shiftsByDate = new Map<string, any[]>();
        const ridesByDate = new Map<string, any[]>();
        
        shifts.forEach(shift => {
            const dateKey = formatDate(new Date(shift.shift_start));
            if (!shiftsByDate.has(dateKey)) {
                shiftsByDate.set(dateKey, []);
            }
            shiftsByDate.get(dateKey)!.push(shift);
        });
        
        rides.forEach(ride => {
            const dateKey = formatDate(new Date(ride.start_time));
            if (!ridesByDate.has(dateKey)) {
                ridesByDate.set(dateKey, []);
            }
            ridesByDate.get(dateKey)!.push(ride);
        });
        
        // Map each date with shift and ride information
        return dateArray.map(date => {
            const dateKey = formatDate(date);
            const dayShifts = shiftsByDate.get(dateKey) || [];
            const dayRides = ridesByDate.get(dateKey) || [];
            
            return {
                day: date.toISOString(),
                hasRide: dayRides.length > 0,
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
                    rides: dayRides
                        .filter(ride => ride.shift_id === shift.id)
                        .map(ride => ({
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

    static async getRidesByDayOfWeek(driverId: string, dayOfWeek: string): Promise<any[]> {
        const dayNumber = getDayNumber(dayOfWeek);
        
        if (dayNumber === undefined) {
            throw new Error('Invalid day of week');
        }
        
        // Get all rides for the day of week
        const rides = await RideRepository.findRidesByDayOfWeek(driverId, dayNumber);
        
        // Get unique shift IDs from rides
        const shiftIds = [...new Set(rides.map(ride => ride.shift_id))];
        
        // Fetch all related shifts
        const shifts = await Promise.all(
            shiftIds.map(shiftId => Shift.findByPk(shiftId))
        );
        
        // Group rides by shift
        const ridesByShift = new Map<string, any[]>();
        rides.forEach(ride => {
            if (!ridesByShift.has(ride.shift_id)) {
                ridesByShift.set(ride.shift_id, []);
            }
            ridesByShift.get(ride.shift_id)!.push(ride);
        });
        
        // Map shifts with their rides
        return shifts
            .filter(shift => shift !== null)
            .map(shift => ({
                id: shift!.id,
                startDate: formatDateTimeCompact(new Date(shift!.shift_start)),
                endDate: shift!.shift_end ? formatDateTimeCompact(new Date(shift!.shift_end)) : 'ongoing',
                stats: {
                    totalEarnings: centsToDecimal(shift!.total_earnings_cents || 0),
                    totalDistance: shift!.total_distance_km || 0,
                    numberOfRides: shift!.number_of_rides || 0,
                    workTime: shift!.work_time_ms ? Math.round(shift!.work_time_ms / 1000 / 60) : 0, // in minutes
                    breakTime: shift!.break_time_ms ? Math.round(shift!.break_time_ms / 1000 / 60) : 0 // in minutes
                },
                rides: (ridesByShift.get(shift!.id) || []).map(ride => ({
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

    static async getWorkTimeStatistics(
        driverId: string,
        view: 'weekly' | 'monthly',
        startDate: Date,
        endDate: Date
    ): Promise<any> {
        // Get all rides in the date range
        const rides = await RideRepository.findRidesInDateRange(driverId, startDate, endDate);
        
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