import {LatLng} from "../../constants/types";

const DEGREE_TO_RADIANS = Math.PI / 180;
const METERS_PER_LAT = 111320;

// returns the approximate distance between two positions in meters
// because we are working with short distances, the earth is assumed to be flat
export function calculateDistance(position1: LatLng, position2: LatLng): number {
    const averageLatInRadians = ((position1.lat + position2.lat) / 2) * DEGREE_TO_RADIANS;
    const cosLat = Math.cos(averageLatInRadians);

    const deltaLat = (position2.lat - position1.lat) * METERS_PER_LAT;
    const deltaLng = (position2.lng - position1.lng) * METERS_PER_LAT * cosLat;

    return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
}