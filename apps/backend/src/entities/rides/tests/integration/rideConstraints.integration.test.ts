import { initializeAssociations } from '../../../../shared/config/associations';
import Ride from '../../ride.model';
import { ValidationError, ForeignKeyConstraintError } from 'sequelize';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';

TestHelpers.setupEnvironment();

beforeAll(async () => {
    initializeAssociations();
    await TestHelpers.setupDatabase();
});

afterEach(async () => {
    await TestHelpers.cleanupDatabase();
});

afterAll(async () => {
    await TestHelpers.closeDatabase();
});


describe('Ride DB Constraints', () => {



    describe('foreign keys', () => {


        it('cant create ride with fake shift id', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();

            await expect(Ride.create({
                shift_id: '00000000-0000-0000-0000-000000000000', // doesn't exist
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "Grafton Street",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ForeignKeyConstraintError);
        });

       
        it('driver must exist', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // ride with fake driver
            await expect(Ride.create({
                shift_id: shift.id,
                driver_id: '00000000-0000-0000-0000-000000000000',
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                address: "Test Address",
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow(ForeignKeyConstraintError); // should fail
        });


        // TODO: this works in postgres but not sqlite
        it.skip('cant delete shift with active rides', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            await TestHelpers.createActiveRide(shift.id, user.id);

            // try to delete - should fail
            await expect(shift.destroy()).rejects.toThrow(ForeignKeyConstraintError);
        });
    });






    describe('unique constraints - one active ride per shift', () => {

        it('prevents double booking', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // First ride - ok
            await TestHelpers.createActiveRide(shift.id, user.id, {
                address: "Airport pickup"
            });

            // Second active ride - should blow up  
            await expect(TestHelpers.createActiveRide(shift.id, user.id, {
                address: "Another ride?? No way"
            })).rejects.toThrow(); // constraint violation
        });


        it('multiple completed rides are fine', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            // First complete ride
            await TestHelpers.createCompletedRide(shift.id, user.id, {
                address: "Morning ride",
                earning_cents: 1000,
                distance_km: 5.0
            });

            // Second one should work too
            const ride2 = await TestHelpers.createCompletedRide(shift.id, user.id, {
                address: "Afternoon ride",
                earning_cents: 1200, // €12
                distance_km: 6.0
            });

            expect(ride2.id).toBeDefined();
            expect(ride2.shift_id).toBe(shift.id); // same shift is ok
        });


    });




    describe('required fields', () => {
        it('needs all the basics', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            const baseData = {
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            };

            // forgot shift_id
            await expect(Ride.create({
                ...baseData,
                driver_id: user.id
            })).rejects.toThrow(ValidationError); // need shift!

            // no driver??
            await expect(Ride.create({
                ...baseData,
                shift_id: shift.id
            })).rejects.toThrow(ValidationError);
        });
    });


    describe('uuid validation', () => {
        it('shift_id must be valid uuid', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();

            await expect(Ride.create({
                shift_id: 'not-a-uuid',
                driver_id: user.id,
                start_latitude: 53.349805,
                start_longitude: -6.260310,
                destination_latitude: 53.359805,
                destination_longitude: -6.270310,
                start_time: new Date(),
                predicted_score: 3,
                end_time: null
            })).rejects.toThrow();
        });

        it('numbers stay numbers', async () => {
            const { user } = await TestHelpers.createAuthenticatedUser();
            const shift = await TestHelpers.createActiveShift(user.id);

            const ride = await TestHelpers.createActiveRide(shift.id, user.id, {
                address: "Number type test"
            });

            expect(typeof ride.start_latitude).toBe('number'); // not string!
            expect(typeof ride.predicted_score).toBe('number');
        });
    });
});
