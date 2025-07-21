export const RIDE_CONSTANTS = {
    EXPIRY_TIME_MS: 4 * 60 * 60 * 1000, // 4 hours
    COORDINATE_BOUNDS: {
        LATITUDE: { MIN: -90, MAX: 90 },
        LONGITUDE: { MIN: -180, MAX: 180 }
    },
    PREDICTION_SCALE: {
        MIN: 0,
        MAX: 1,
        RATING_MIN: 1,
        RATING_MAX: 5
    },
    DEFAULT_RATING: 3
};

export const RIDE_ERRORS = {
    NOT_FOUND: 'Ride not found',
    ALREADY_ENDED: 'Ride is already ended',
    NO_ACTIVE_SHIFT: 'No active shift found. Please start a shift before starting a ride.',
    NO_ACTIVE_SHIFT_STATUS: 'No active shift found. Please start a shift before checking ride status.',
    RIDE_IN_PROGRESS: 'Another ride is already in progress. Please end the current ride first.',
    PAUSED_SHIFT: 'Cannot start ride while on break. Please continue your shift first.',
    INVALID_LATITUDE: 'Invalid latitude provided',
    INVALID_LONGITUDE: 'Invalid longitude provided'
};