export const SHIFT_CONSTANTS = {

    MAX_SHIFT_DURATION_MS: 12 * 60 * 60 * 1000, // 12 hours

    DEFAULT_PLANNED_DURATION_MS: 8 * 60 * 60 * 1000, // 8 hours
    
};

export const SHIFT_ERRORS = {
    SHIFT_ALREADY_ACTIVE: 'Driver already has an active shift',
    SHIFT_NOT_FOUND: 'Shift not found',
    SHIFT_ALREADY_ENDED: 'Shift has already ended',
    INVALID_SHIFT_DURATION: 'Invalid shift duration'
};