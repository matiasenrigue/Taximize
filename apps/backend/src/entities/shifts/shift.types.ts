export interface ShiftCreationData {
    driver_id: string;
    shift_start: Date;
    shift_start_location_latitude?: number;
    shift_start_location_longitude?: number;
    planned_duration_ms?: number; // defaults to 8 hours
}


export interface ShiftEndData {
    shift_end: Date; 
    shift_end_location_latitude?: number;  
    shift_end_location_longitude?: number;  
    total_duration_ms?: number;
    work_time_ms?: number; // excluding breaks
    break_time_ms?: number;
    num_breaks?: number;
    avg_break_ms?: number;

    total_earnings_cents?: number;
    total_distance_km?: number;
    number_of_rides?: number;
}
