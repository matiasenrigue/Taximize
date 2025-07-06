export const MAP_ID = "f1310920ec56c7b65c64dec9";
export const MAP_CENTER = {lat: 40.7831, lng: -73.9712};

export const BREAK_MODAL_TIMEOUT = 3 * 60 * 60 * 1000;
export const DEFAULT_BREAK_DURATION = 15 * 60 * 1000;

// fare prices (in cents)
export const BASE_FARE = 300;
export const FARE_TIME_RATE = 70;
export const FARE_DISTANCE_RATE = 70;

// fare thresholds
export const FARE_TIME_THRESHOLD = 1000 * 60; // in milliseconds
export const FARE_DISTANCE_THRESHOLD = 321.9; // in meter
export const FARE_SPEED_THRESHOLD = 19.3 * 1000 / (60 * 60 * 1000); // in m/ms