export interface ShiftCreationData {
    driver_id: string;
    shift_start: Date;
    shift_start_location_latitude?: number;
    shift_start_location_longitude?: number;
    planned_duration_ms?: number;
}

export interface ShiftEndData {
    shift_end: Date;
    shift_end_location_latitude?: number;
    shift_end_location_longitude?: number;
    total_duration_ms?: number;
    work_time_ms?: number;
    break_time_ms?: number;
    num_breaks?: number;
    avg_break_ms?: number;
    total_earnings_cents?: number;
    total_distance_km?: number;
    number_of_rides?: number;
}

export interface ShiftMetrics {
    totalDurationMs: number;
    workTimeMs: number;
    breakTimeMs: number;
    workTimePercent: number;
    breakTimePercent: number;
    averageEarningsPerHour: number | null;
    averageDistancePerRide: number | null;
    averageEarningsPerRide: number | null;
    isOvertime: boolean;
}

export interface ShiftLocation {
    latitude: number;
    longitude: number;
}

export interface ShiftSummary {
    id: string;
    driverId: string;
    startTime: Date;
    endTime: Date | null;
    isActive: boolean;
    metrics?: ShiftMetrics;
}

export interface ShiftFilters {
    driverId?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    isOvertime?: boolean;
}

export interface ShiftPauseInfo {
    totalPauseTimeMs: number;
    numberOfPauses: number;
    averagePauseDurationMs: number;
    lastPauseStartTime?: Date;
    isCurrentlyPaused: boolean;
}

export interface ShiftRideInfo {
    totalRides: number;
    activeRides: number;
    completedRides: number;
    totalEarningsCents: number;
    totalDistanceKm: number;
}