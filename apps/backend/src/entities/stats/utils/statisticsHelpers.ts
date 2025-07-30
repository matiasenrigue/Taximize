import { generateDateArray, getWeekdayLabel, getMonthDayLabel, formatDate, calculateDurationHours } from './dateHelpers';
import { centsToDecimal } from './currencyHelpers';

interface EarningsData {
    date: string;
    totalCents: number;
}

interface RideTimeData {
    startTime: Date;
    endTime: Date;
}

interface WorkTimeByDate {
    [date: string]: {
        withPassengerTime: number;
        emptyTime: number;
    };
}

export function generateEarningsBreakdown(
    view: 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    earningsData: EarningsData[]
): Array<{ label: string; date: string; value: number }> {

    const dates = generateDateArray(startDate, endDate);
    const earningsMap = new Map(
        earningsData.map(item => [item.date, centsToDecimal(item.totalCents)])
    );
    
    return dates.map(date => ({
        label: view === 'weekly' ? getWeekdayLabel(date) : getMonthDayLabel(date),
        date: formatDate(date),
        value: earningsMap.get(formatDate(date)) || 0
    }));
}


export function calculateTotalEarnings(earningsData: EarningsData[]): number {
    const totalCents = earningsData.reduce((sum, item) => sum + item.totalCents, 0);
    return centsToDecimal(totalCents);
}


export function groupRidesByDate(rides: any[]): Map<string, any[]> {
    const ridesByDate = new Map<string, any[]>();
    
    rides.forEach(ride => {
        const dateKey = formatDate(new Date(ride.start_time));
        if (!ridesByDate.has(dateKey)) {
            ridesByDate.set(dateKey, []);
        }
        ridesByDate.get(dateKey)!.push(ride);
    });
    
    return ridesByDate;
}



/**
 * Calculates time spent with passengers vs waiting between rides per day
 */ 
export function calculateWorkTimeByDate(rides: any[]): WorkTimeByDate {

    const workTimeByDate: WorkTimeByDate = {};
    
    // Group rides by date and process in single pass
    const ridesByDate = new Map<string, any[]>();
    
    rides.forEach(ride => {
        const dateStr = formatDate(new Date(ride.start_time));
        if (!ridesByDate.has(dateStr)) {
            ridesByDate.set(dateStr, []);
        }
        ridesByDate.get(dateStr)!.push(ride);
    });
    
    ridesByDate.forEach((dayRides, date) => {
        
        // Sort rides by start time
        dayRides.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        let totalWithPassengerTime = 0;
        let totalEmptyTime = 0;
        let previousRideEnd: Date | null = null;
        
        // Single pass to calculate both passenger time and empty time
        dayRides.forEach((ride, index) => {
            const rideStart = new Date(ride.start_time);
            const rideEnd = ride.end_time ? new Date(ride.end_time) : null;
            
            // Calculate passenger time
            if (rideEnd) {
                totalWithPassengerTime += calculateDurationHours(rideStart, rideEnd);
            }
            
            // Calculate empty time from previous ride
            if (previousRideEnd && previousRideEnd < rideStart) {
                totalEmptyTime += calculateDurationHours(previousRideEnd, rideStart);
            }
            
            previousRideEnd = rideEnd;
        });
        
        workTimeByDate[date] = {
            withPassengerTime: Math.round(totalWithPassengerTime * 100) / 100,
            emptyTime: Math.round(totalEmptyTime * 100) / 100
        };
    });
    
    return workTimeByDate;
}



/**
 * Generates time breakdown with labels based on view type (weekly: "Mon", monthly: "15")
 */ 
export function generateWorkTimeBreakdown(
    view: 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    workTimeData: WorkTimeByDate
): Array<{ label: string; date: string; withPassengerTime: number; emptyTime: number }> {

    const dates = generateDateArray(startDate, endDate);
    
    return dates.map(date => {
        const dateKey = formatDate(date);
        const dayData = workTimeData[dateKey] || { withPassengerTime: 0, emptyTime: 0 };
        
        return {
            label: view === 'weekly' ? getWeekdayLabel(date) : getMonthDayLabel(date),
            date: dateKey,
            withPassengerTime: dayData.withPassengerTime,
            emptyTime: dayData.emptyTime
        };
    });
}