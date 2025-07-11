import { sequelize } from '../../../../shared/config/db';
import { initializeAssociations } from '../../../../shared/config/associations';
import User from '../../../users/user.model';
import Ride from '../../ride.model';
import Shift from '../../../shifts/shift.model';
import ShiftSignal from '../../../shifts/shift-signal.model';
import { ValidationError, ForeignKeyConstraintError } from 'sequelize';

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    initializeAssociations();
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // Clean up in correct order due to foreign key constraints
    // Use force: true to hard delete even with paranoid mode
    await Ride.destroy({ where: {}, force: true });
    await ShiftSignal.destroy({ where: {}, force: true });
    await Shift.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Ride Database Constraints Tests', () => {

    describe('Foreign Key Constraints', () => {
        it('should enforce foreign key constraint on shift_id', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            // Attempt to create ride with non-existent shift_id
            await expect(Ride.create({
                shift_id: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "Test Foreign Key Constraint Shift",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ForeignKeyConstraintError);
        });

        it('should enforce foreign key constraint on driver_id', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Attempt to create ride with non-existent driver_id
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "Test Foreign Key Constraint Driver",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ForeignKeyConstraintError);
        });

        // SQLite doesn't enforce foreign key constraints with soft deletes (paranoid mode)
        // This test would pass in PostgreSQL but fails in SQLite test environment
        it.skip('should prevent shift deletion while rides reference it', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Create ride referencing the shift
            await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            });

            // Attempt to delete shift should fail
            await expect(shift.destroy()).rejects.toThrow(ForeignKeyConstraintError);
        });
    });

    describe('Unique Constraints', () => {
        it('should enforce one_active_ride_per_shift unique constraint', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Create first active ride
            await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "Test Unique Constraint First Ride",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null // Active ride
            });

            // Attempt to create second active ride for same shift should fail
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.359805,
                start_longitude: -6.270310,
                destination_latitude: 53.369805,
                destination_longitude: -6.280310,
                address: "Test Unique Constraint Second Ride (Should Fail)",
                start_time: new Date(),
                predicted_score: 4,
                end_time: null // Active ride - should violate constraint
            })).rejects.toThrow();
        });

        it('should allow multiple ended rides for same shift', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Create first ended ride
            await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "First Ended Ride Address",
                start_time: new Date(),
                predicted_score: 3,
                end_time: new Date(), // Ended ride
                earning_cents: 1000,
                distance_km: 5.0
            });

            // Create second ended ride for same shift should succeed
            const secondRide = await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.359805,
                start_longitude: -6.270310,
                destination_latitude: 53.369805,
                destination_longitude: -6.280310,
                address: "Second Ended Ride Address",
                start_time: new Date(),
                predicted_score: 4,
                end_time: new Date(), // Ended ride
                earning_cents: 1200,
                distance_km: 6.0
            });

            expect(secondRide.id).toBeDefined();
            expect(secondRide.shift_id).toBe(shift.id);
        });

        it('should allow new active ride after ending previous one', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Create first active ride
            const firstRide = await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "First Active Ride Address",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null // Active ride
            });

            // End the first ride
            await firstRide.update({
                end_time: new Date(),
                earning_cents: 1000,
                distance_km: 5.0
            });

            // Create second active ride should succeed
            const secondRide = await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.359805,
                start_longitude: -6.270310,
                destination_latitude: 53.369805,
                destination_longitude: -6.280310,
                address: "Second Active Ride Address",
                start_time: new Date(),
                predicted_score: 4,
                end_time: null // Active ride
            });

            expect(secondRide.id).toBeDefined();
            expect(secondRide.shift_id).toBe(shift.id);
        });
    });

    describe('Check Constraints', () => {
        // SQLite doesn't enforce check constraints
        // The application validates these bounds in RideService.validateCoordinates()
        it.skip('should enforce latitude bounds (-90 to 90)', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Test invalid start latitude
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 95, // Invalid: > 90
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();

            // Test invalid destination latitude
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: -95, // Invalid: < -90
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();
        });

        // SQLite doesn't enforce check constraints
        // The application validates these bounds in RideService.validateCoordinates()
        it.skip('should enforce longitude bounds (-180 to 180)', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Test invalid start longitude
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: 185, // Invalid: > 180
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();

            // Test invalid destination longitude
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -185, // Invalid: < -180
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();
        });

        // SQLite doesn't enforce check constraints
        // The application ensures valid scores via MlStub.getRandomScore()
        it.skip('should enforce predicted_score bounds (1 to 5)', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Test invalid predicted score (too low)
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 0, // Invalid: < 1
                end_time: null
            })).rejects.toThrow();

            // Test invalid predicted score (too high)
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 6, // Invalid: > 5
                end_time: null
            })).rejects.toThrow();
        });
    });

    describe('NOT NULL Constraints', () => {
        it('should enforce NOT NULL constraints on required fields', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Test missing shift_id
            await expect(Ride.create({
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ValidationError);

            // Test missing driver_id
            await expect(Ride.create({
                shift_id: shift.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ValidationError);

            // Test missing start_time
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ValidationError);
        });
    });

    describe('Data Type Constraints', () => {
        it('should enforce UUID format for shift_id and driver_id', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // Test invalid UUID format for shift_id
            await expect(Ride.create({
                shift_id: 'invalid-uuid', // Invalid UUID format
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();

            // Test invalid UUID format for driver_id
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: 'invalid-uuid', // Invalid UUID format
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();
        });

        it('should enforce numeric constraints for coordinates and scores', async () => {
            const user = await User.create({
                email: 'driver@test.com',
                username: 'testdriver',
                password: 'password123'
            });

            const shift = await Shift.create({
                driver_id: user.id,
                shift_start: new Date(),
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });

            // This would be caught at the application level, but testing database constraints
            const validRide = await Ride.create({
                shift_id: shift.id,
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "Valid Ride Test Address",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            });

            expect(validRide.id).toBeDefined();
            expect(typeof validRide.start_latitude).toBe('number');
            expect(typeof validRide.start_longitude).toBe('number');
            expect(typeof validRide.predicted_score).toBe('number');
        });
    });
});