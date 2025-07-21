import { generateDateArray, getWeekdayLabel, getMonthDayLabel, formatDate, calculateDurationHours } from '../../../utils/dateHelpers';
import { centsToDecimal } from '../../../utils/currencyHelpers';

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

export function calculateWorkTimeByDate(rides: any[]): WorkTimeByDate {
    const ridesByDate = groupRidesByDate(rides);
    const workTimeByDate: WorkTimeByDate = {};
    
    ridesByDate.forEach((dayRides, date) => {
        let totalWithPassengerTime = 0;
        let totalEmptyTime = 0;
        
        // Sort rides by start time
        dayRides.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        // Calculate time with passengers
        dayRides.forEach(ride => {
            if (ride.start_time && ride.end_time) {
                totalWithPassengerTime += calculateDurationHours(
                    new Date(ride.start_time),
                    new Date(ride.end_time)
                );
            }
        });
        
        // Calculate empty time between rides
        for (let i = 1; i < dayRides.length; i++) {
            const previousRideEnd = new Date(dayRides[i - 1].end_time);
            const currentRideStart = new Date(dayRides[i].start_time);
            
            if (previousRideEnd < currentRideStart) {
                totalEmptyTime += calculateDurationHours(previousRideEnd, currentRideStart);
            }
        }
        
        workTimeByDate[date] = {
            withPassengerTime: Math.round(totalWithPassengerTime * 100) / 100,
            emptyTime: Math.round(totalEmptyTime * 100) / 100
        };
    });
    
    return workTimeByDate;
}

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