// units
export const MINUTE_IN_MILLISECONDS = 60 * 1000;
export const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS;

// map config
export const MAP_ID = "f1310920ec56c7b65c64dec9";
export const MAP_CENTER = {lat: 40.7831, lng: -73.9712};

// default config
export const DEFAULT_SHIFT_DURATION = 8 * HOUR_IN_MILLISECONDS;
export const DEFAULT_BREAK_DURATION = 15 * MINUTE_IN_MILLISECONDS;
export const BREAK_MODAL_TIMEOUT = 3 * HOUR_IN_MILLISECONDS;

// fare prices (in cents)
export const BASE_FARE = 300;
export const FARE_TIME_RATE = 70;
export const FARE_DISTANCE_RATE = 70;

// fare thresholds
export const FARE_TIME_THRESHOLD = MINUTE_IN_MILLISECONDS; // in milliseconds
export const FARE_DISTANCE_THRESHOLD = 321.9; // in meter
export const FARE_SPEED_THRESHOLD = 19.3 * 1000 / HOUR_IN_MILLISECONDS; // in m/ms

// design
export const COLOR_PRIMARY = "#FBB93C";