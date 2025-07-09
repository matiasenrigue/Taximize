import {
  snakeToCamel,
  camelToSnake,
  transformKeysSnakeToCamel,
  transformKeysCamelToSnake,
  modelToResponse
} from '../caseTransformer';

describe('Case Transformer Utilities', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('hello_world')).toBe('helloWorld');
      expect(snakeToCamel('start_latitude')).toBe('startLatitude');
      expect(snakeToCamel('estimated_fare_cents')).toBe('estimatedFareCents');
      expect(snakeToCamel('already_camel')).toBe('alreadyCamel');
      expect(snakeToCamel('single')).toBe('single');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('helloWorld')).toBe('hello_world');
      expect(camelToSnake('startLatitude')).toBe('start_latitude');
      expect(camelToSnake('estimatedFareCents')).toBe('estimated_fare_cents');
      expect(camelToSnake('single')).toBe('single');
    });
  });

  describe('transformKeysSnakeToCamel', () => {
    it('should handle null and undefined', () => {
      expect(transformKeysSnakeToCamel(null)).toBeNull();
      expect(transformKeysSnakeToCamel(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(transformKeysSnakeToCamel('string')).toBe('string');
      expect(transformKeysSnakeToCamel(123)).toBe(123);
      expect(transformKeysSnakeToCamel(true)).toBe(true);
    });

    it('should handle dates', () => {
      const date = new Date();
      expect(transformKeysSnakeToCamel(date)).toBe(date);
    });

    it('should transform object keys', () => {
      const input = {
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_address: '123 Main St',
        is_active: true
      };

      const expected = {
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationAddress: '123 Main St',
        isActive: true
      };

      expect(transformKeysSnakeToCamel(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = {
        ride_id: '123',
        ride_details: {
          start_time: '2024-01-01',
          end_time: '2024-01-01',
          driver_info: {
            driver_id: '456',
            driver_name: 'John Doe'
          }
        }
      };

      const expected = {
        rideId: '123',
        rideDetails: {
          startTime: '2024-01-01',
          endTime: '2024-01-01',
          driverInfo: {
            driverId: '456',
            driverName: 'John Doe'
          }
        }
      };

      expect(transformKeysSnakeToCamel(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = [
        { ride_id: '1', start_time: '2024-01-01' },
        { ride_id: '2', start_time: '2024-01-02' }
      ];

      const expected = [
        { rideId: '1', startTime: '2024-01-01' },
        { rideId: '2', startTime: '2024-01-02' }
      ];

      expect(transformKeysSnakeToCamel(input)).toEqual(expected);
    });
  });

  describe('transformKeysCamelToSnake', () => {
    it('should transform object keys from camelCase to snake_case', () => {
      const input = {
        startLatitude: 53.349805,
        startLongitude: -6.260310,
        destinationAddress: '123 Main St',
        isActive: true
      };

      const expected = {
        start_latitude: 53.349805,
        start_longitude: -6.260310,
        destination_address: '123 Main St',
        is_active: true
      };

      expect(transformKeysCamelToSnake(input)).toEqual(expected);
    });
  });

  describe('modelToResponse', () => {
    it('should handle Sequelize model with toJSON method', () => {
      const mockModel = {
        toJSON: () => ({
          driver_id: '123',
          shift_start: '2024-01-01',
          is_active: true
        })
      };

      const expected = {
        driverId: '123',
        shiftStart: '2024-01-01',
        isActive: true
      };

      expect(modelToResponse(mockModel)).toEqual(expected);
    });

    it('should handle plain objects', () => {
      const input = {
        driver_id: '123',
        shift_start: '2024-01-01'
      };

      const expected = {
        driverId: '123',
        shiftStart: '2024-01-01'
      };

      expect(modelToResponse(input)).toEqual(expected);
    });
  });
});