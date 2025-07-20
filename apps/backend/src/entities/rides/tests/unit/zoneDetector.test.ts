import { findZoneForCoordinate, getZonesForRide } from '../../utils/zoneDetector';

describe('Zone Detector (Pre-processed Polygons)', () => {
    describe('findZoneForCoordinate', () => {
        it('should correctly identify JFK Airport', () => {
            // JFK Airport test coordinates
            const zone = findZoneForCoordinate(40.6396, -73.7828);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('JFK Airport');
            expect(zone?.borough).toBe('Queens');
            expect(zone?.id).toBe(132);
        });

        it('should correctly identify Newark Airport', () => {
            // Newark Airport test coordinates
            const zone = findZoneForCoordinate(40.6918, -74.1740);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('Newark Airport');
            expect(zone?.borough).toBe('EWR');
            expect(zone?.id).toBe(1);
        });

        it('should correctly identify Times Square', () => {
            // Times Square coordinates
            const zone = findZoneForCoordinate(40.7580, -73.9855);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('Times Sq/Theatre District');
            expect(zone?.borough).toBe('Manhattan');
        });

        it('should correctly identify Central Park', () => {
            // Central Park coordinates
            const zone = findZoneForCoordinate(40.7829, -73.9654);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('Central Park');
            expect(zone?.borough).toBe('Manhattan');
        });

        it('should return null for coordinates outside NYC', () => {
            // Coordinates for Philadelphia
            const zone = findZoneForCoordinate(39.9526, -75.1652);
            expect(zone).toBeNull();
        });

        it('should return null for coordinates in the ocean', () => {
            // Coordinates in the Atlantic Ocean
            const zone = findZoneForCoordinate(40.5, -73.0);
            expect(zone).toBeNull();
        });

        it('should throw error for invalid latitude', () => {
            expect(() => findZoneForCoordinate(91, -73.78)).toThrow('Invalid latitude: 91');
            expect(() => findZoneForCoordinate(-91, -73.78)).toThrow('Invalid latitude: -91');
        });

        it('should throw error for invalid longitude', () => {
            expect(() => findZoneForCoordinate(40.64, 181)).toThrow('Invalid longitude: 181');
            expect(() => findZoneForCoordinate(40.64, -181)).toThrow('Invalid longitude: -181');
        });

        it('should handle zones with multiple polygons', () => {
            // Testing a point in Broad Channel (which is surrounded by Jamaica Bay)
            const zone = findZoneForCoordinate(40.6115, -73.8228);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('Broad Channel');
            expect(zone?.borough).toBe('Queens');
        });
    });

    describe('getZonesForRide', () => {
        it('should correctly identify zones for a ride from JFK to Times Square', () => {
            const zones = getZonesForRide(
                40.6396, -73.7828,  // JFK Airport
                40.7580, -73.9855   // Times Square
            );
            
            expect(zones.originZone).toBe('JFK Airport');
            expect(zones.destinationZone).toBe('Times Sq/Theatre District');
        });

        it('should correctly identify zones for a ride from Newark to Central Park', () => {
            const zones = getZonesForRide(
                40.6918, -74.1740,  // Newark Airport
                40.7829, -73.9654   // Central Park
            );
            
            expect(zones.originZone).toBe('Newark Airport');
            expect(zones.destinationZone).toBe('Central Park');
        });

        it('should handle one zone being null', () => {
            const zones = getZonesForRide(
                40.6396, -73.7828,  // JFK Airport
                39.9526, -75.1652   // Philadelphia (outside NYC)
            );
            
            expect(zones.originZone).toBe('JFK Airport');
            expect(zones.destinationZone).toBeNull();
        });

        it('should handle both zones being null', () => {
            const zones = getZonesForRide(
                39.9526, -75.1652,  // Philadelphia
                38.9072, -77.0369   // Washington DC
            );
            
            expect(zones.originZone).toBeNull();
            expect(zones.destinationZone).toBeNull();
        });

        it('should handle coordinates near zone boundaries', () => {
            // Testing edge cases near zone boundaries
            const zones = getZonesForRide(
                40.7589, -73.9851,  // Near Times Square
                40.7825, -73.9655   // Near Central Park
            );
            
            expect(zones.originZone).not.toBeNull();
            expect(zones.destinationZone).not.toBeNull();
        });
    });
});