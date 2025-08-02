/**
 * Generates Array of the days between the start and end day
 */
export function generateDateArray(startDate: Date, endDate: Date): Date[] {
    
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * String of Day of the week to numeric equivalent
 */
export function getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    };
    
    return days[dayName.toLowerCase()];
}


/** 
 * Returns duration as "X minutes" or "X hour(s) Y minutes"
 */
export function formatDuration(startTime: Date, endTime: Date): string {
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.round(durationMs / 1000 / 60);
    
    if (minutes < 60) {
        return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
}

/** 
 * Returns 3-letter weekday abbreviation: "Sun", "Mon", etc.
 */
export function getWeekdayLabel(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

/** 
 * Returns date as "YYYY-MM-DD"
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** 
 * Returns day of month as string: "1", "2", ... "31"
 */
export function getMonthDayLabel(date: Date): string {
    return date.getDate().toString();
}


export function isValidDayOfWeek(day: string): boolean {
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return validDays.includes(day.toLowerCase());
}


export function calculateDurationHours(startTime: Date, endTime: Date): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    return Math.round((durationMs / 1000 / 60 / 60) * 100) / 100; // Round to 2 decimal places
}


/** 
 * Returns datetime as "YYYY-MM-DD HH:MM" (24-hour format)
 */
export function formatDateTimeCompact(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}