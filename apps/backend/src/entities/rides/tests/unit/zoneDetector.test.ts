import { findZoneForCoordinate, getZonesForRide } from '../../utils/zoneDetector';

// Tests for NYC zone detection
describe('Zone Detector (Pre-processed Polygons)', () => {



    describe('findZoneForCoordinate', () => {
  
        it('finds JFK', () => {
            const zone = findZoneForCoordinate(40.6396, -73.7828);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('JFK Airport');
            expect(zone?.borough).toBe('Queens');
            expect(zone?.id).toBe(132);
        });

  
        it(' Newark Airport', () => {
            const zone = findZoneForCoordinate(40.6918, -74.1740);
            expect(zone?.name).toBe('Newark Airport');
            expect(zone?.borough).toBe('EWR');
            expect(zone?.id).toBe(1);
        });

  
        it('Times Square detection', () => {
            const zone = findZoneForCoordinate(40.7580, -73.9855);
            expect(zone).not.toBeNull();
            expect(zone?.name).toBe('Times Sq/Theatre District'); 
            expect(zone?.borough).toBe('Manhattan');
        });

  
        it('central park', () => {
            const z = findZoneForCoordinate(40.7829, -73.9654);
            expect(z).not.toBeNull();
            expect(z?.name).toBe('Central Park');
            expect(z?.borough).toBe('Manhattan');
        });

  
        it('handles philly (outside service area)', () => {
            const zone = findZoneForCoordinate(39.9526, -75.1652);
            expect(zone).toBeNull(); // not in NYC
        });

  
        it('ocean coordinates', () => {
            const zone = findZoneForCoordinate(40.5, -73.0);
            expect(zone).toBeNull();
        });

  
        it('validates coordinates', () => {
            // bad lat
            expect(() => findZoneForCoordinate(91, -73.78)).toThrow('Invalid latitude');
            expect(() => findZoneForCoordinate(-91, -73.78)).toThrow('latitude: -91');
            
            // bad lng
            expect(() => findZoneForCoordinate(40.64, 181)).toThrow('longitude');
        });

  
        it.skip('edge case: Broad Channel surrounded by water', () => {
            // TODO: verify this actually works with real map data
            const zone = findZoneForCoordinate(40.6115, -73.8228);
            expect(zone?.name).toBe('Broad Channel');
            expect(zone?.borough).toBe('Queens');
        });
    });




    describe('getZonesForRide', () => {
        const JFK_COORDS = [40.6396, -73.7828];
        const TIMES_SQ = [40.7580, -73.9855];
        
  
        it('typical airport pickup', () => {
            const zones = getZonesForRide(
                JFK_COORDS[0], JFK_COORDS[1],
                TIMES_SQ[0], TIMES_SQ[1]
            );
            
            expect(zones.originZone).toBe('JFK Airport'); // pickup
            expect(zones.destinationZone).toBe('Times Sq/Theatre District'); // dropoff
        });

  
        it('Newark to Central Park ride', () => {
            const zones = getZonesForRide(
                40.6918, -74.1740,
                40.7829, -73.9654
            );
            
            expect(zones.originZone).toBe('Newark Airport');
            expect(zones.destinationZone).toBe('Central Park');
        });

  
        it('partial coverage - destination outside NYC', () => {
            const zones = getZonesForRide(
                40.6396, -73.7828,  // JFK
                39.9526, -75.1652   // Philly
            );
            
            expect(zones.originZone).toBe('JFK Airport');
            expect(zones.destinationZone).toBeNull(); // outside service area
        });

        // edge case from production logs
  
        it('handles rides completely outside NYC', () => {
            const zones = getZonesForRide(
                39.9526, -75.1652,  // Philadelphia  
                38.9072, -77.0369   // DC
            );
            
            expect(zones.originZone).toBeNull();
            expect(zones.destinationZone).toBeNull();
        });
    });
});
