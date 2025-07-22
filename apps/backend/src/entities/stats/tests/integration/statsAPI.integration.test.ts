import request from 'supertest';
import app from '../../../../app';
import { sequelize } from '../../../../shared/config/db';
import { User } from '../../../users/user.model';
import { Shift } from '../../../shifts/shift.model';
import { Ride } from '../../../rides/ride.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

describe('Statistics API', () => {
    let authToken: string;
    let driver: User;
    let user: User;

    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    beforeEach(async () => {
        // Create test user and driver
        const auth = await TestHelpers.createAuthenticatedUser();
        authToken = auth.token;
        driver = auth.driver;
        user = auth.user;
    });

    afterEach(async () => {
        await Ride.destroy({ where: {}, force: true });
        await Shift.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('GET /api/stats/shifts-by-days', () => {
        it('should return last 7 days with ride status', async () => {
            // Create a shift
            const shift = await TestHelpers.createActiveShift(driver.id);

            // Create rides for specific days
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            await Ride.create({
                shift_id: shift.id,
                driver_id: driver.id,
                start_latitude: -33.8688,
                start_longitude: 151.2093,
                destination_latitude: -33.8600,
                destination_longitude: 151.2111,
                address: 'Test Address',
                start_time: yesterday,
                end_time: new Date(yesterday.getTime() + 30 * 60 * 1000),
                predicted_score: 4,
                earning_cents: 2500,
                earning_per_min: 83,
                distance_km: 5.2
            });

            const response = await request(app)
                .get('/api/stats/shifts-by-days')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(7);
            expect(response.body.data[0]).toHaveProperty('day');
            expect(response.body.data[0]).toHaveProperty('hasRide');
            expect(response.body.data[0]).toHaveProperty('shifts');
            expect(response.body.data[0].shifts).toBeInstanceOf(Array);
        });

        it('should accept custom days parameter', async () => {
            const response = await request(app)
                .get('/api/stats/shifts-by-days?days=14')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(14);
        });
    });

    describe('GET /api/stats/rides-by-weekday', () => {
        it('should return rides for specific day of week', async () => {
            const shift = await TestHelpers.createActiveShift(driver.id);

            // Create a ride for Monday
            const monday = new Date('2025-01-20'); // This is a Monday
            await Ride.create({
                shift_id: shift.id,
                driver_id: driver.id,
                start_latitude: -33.8688,
                start_longitude: 151.2093,
                destination_latitude: -33.8600,
                destination_longitude: 151.2111,
                address: '123 Main St, Sydney',
                start_time: monday,
                end_time: new Date(monday.getTime() + 25 * 60 * 1000),
                predicted_score: 4,
                earning_cents: 3550,
                earning_per_min: 142,
                distance_km: 7.5
            });

            const response = await request(app)
                .get('/api/stats/rides-by-weekday?day=monday')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            if (response.body.data.length > 0) {
                const shift = response.body.data[0];
                expect(shift).toHaveProperty('id');
                expect(shift).toHaveProperty('startDate');
                expect(shift).toHaveProperty('endDate');
                expect(shift).toHaveProperty('stats');
                expect(shift.stats).toHaveProperty('totalEarnings');
                expect(shift.stats).toHaveProperty('numberOfRides');
                expect(shift).toHaveProperty('rides');
                expect(shift.rides).toBeInstanceOf(Array);
                if (shift.rides.length > 0) {
                    const ride = shift.rides[0];
                    expect(ride).toHaveProperty('id');
                    expect(ride).toHaveProperty('startDate');
                    expect(ride).toHaveProperty('endDate');
                    expect(ride).toHaveProperty('from');
                    expect(ride).toHaveProperty('to');
                    expect(ride).toHaveProperty('duration');
                    expect(ride).toHaveProperty('fare');
                    expect(ride).toHaveProperty('predictedScore');
                    expect(ride).toHaveProperty('distanceKm');
                    expect(ride).toHaveProperty('farePerMinute');
                }
            }
        });

        it('should return error for invalid day', async () => {
            const response = await request(app)
                .get('/api/stats/rides-by-weekday?day=invalidday')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/stats/earnings', () => {
        beforeEach(async () => {
            const shift = await TestHelpers.createActiveShift(driver.id);

            // Create rides with earnings for testing
            const dates = [
                new Date('2025-01-20'), // Monday
                new Date('2025-01-21'), // Tuesday
                new Date('2025-01-22'), // Wednesday
            ];

            for (let i = 0; i < dates.length; i++) {
                await Ride.create({
                    shift_id: shift.id,
                    driver_id: driver.id,
                    start_latitude: -33.8688,
                    start_longitude: 151.2093,
                    destination_latitude: -33.8600,
                    destination_longitude: 151.2111,
                    address: 'Test Address',
                    start_time: dates[i],
                    end_time: new Date(dates[i].getTime() + 30 * 60 * 1000),
                    predicted_score: 4,
                    earning_cents: (i + 1) * 10000, // 100, 200, 300 dollars
                    earning_per_min: 100,
                    distance_km: 5.0
                });
            }
        });

        it('should return weekly earnings statistics', async () => {
            const response = await request(app)
                .get('/api/stats/earnings?view=weekly&startDate=2025-01-20&endDate=2025-01-26')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalEarnings');
            expect(response.body.data).toHaveProperty('view', 'weekly');
            expect(response.body.data).toHaveProperty('breakdown');
            expect(response.body.data.breakdown).toHaveLength(7);
            expect(response.body.data.breakdown[0]).toHaveProperty('label');
            expect(response.body.data.breakdown[0]).toHaveProperty('date');
            expect(response.body.data.breakdown[0]).toHaveProperty('value');
        });

        it('should return monthly earnings statistics', async () => {
            const response = await request(app)
                .get('/api/stats/earnings?view=monthly&startDate=2025-01-01&endDate=2025-01-31')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.view).toBe('monthly');
            expect(response.body.data.breakdown).toHaveLength(31);
        });

        it('should return error for missing parameters', async () => {
            const response = await request(app)
                .get('/api/stats/earnings')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/stats/worktime', () => {
        beforeEach(async () => {
            const shift = await TestHelpers.createActiveShift(driver.id);

            // Create rides with time gaps for testing
            const date = new Date('2025-01-20T10:00:00Z');
            
            // First ride: 10:00 - 10:30 (30 min with passenger)
            await Ride.create({
                shift_id: shift.id,
                driver_id: driver.id,
                start_latitude: -33.8688,
                start_longitude: 151.2093,
                destination_latitude: -33.8600,
                destination_longitude: 151.2111,
                address: 'Test Address',
                start_time: date,
                end_time: new Date(date.getTime() + 30 * 60 * 1000),
                predicted_score: 4,
                earning_cents: 2500,
                earning_per_min: 83,
                distance_km: 5.0
            });

            // Second ride: 11:00 - 11:45 (45 min with passenger, 30 min empty time)
            const secondRideStart = new Date(date.getTime() + 60 * 60 * 1000);
            await Ride.create({
                shift_id: shift.id,
                driver_id: driver.id,
                start_latitude: -33.8600,
                start_longitude: 151.2111,
                destination_latitude: -33.8700,
                destination_longitude: 151.2200,
                address: 'Test Address 2',
                start_time: secondRideStart,
                end_time: new Date(secondRideStart.getTime() + 45 * 60 * 1000),
                predicted_score: 5,
                earning_cents: 3500,
                earning_per_min: 78,
                distance_km: 7.0
            });
        });

        it('should return weekly worktime statistics', async () => {
            const response = await request(app)
                .get('/api/stats/worktime?view=weekly&startDate=2025-01-20&endDate=2025-01-26')
                .set('Authorization', `Bearer ${authToken}`);

            if (response.status !== 200) {
                console.error('Error response:', response.body);
            }
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('view', 'weekly');
            expect(response.body.data).toHaveProperty('breakdown');
            expect(response.body.data.breakdown).toHaveLength(7);
            expect(response.body.data.breakdown[0]).toHaveProperty('label');
            expect(response.body.data.breakdown[0]).toHaveProperty('date');
            expect(response.body.data.breakdown[0]).toHaveProperty('withPassengerTime');
            expect(response.body.data.breakdown[0]).toHaveProperty('emptyTime');
        });

        it('should return monthly worktime statistics', async () => {
            const response = await request(app)
                .get('/api/stats/worktime?view=monthly&startDate=2025-01-01&endDate=2025-01-31')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.view).toBe('monthly');
            expect(response.body.data.breakdown).toHaveLength(31);
        });

        it('should validate date range', async () => {
            const response = await request(app)
                .get('/api/stats/worktime?view=weekly&startDate=2025-01-26&endDate=2025-01-20')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('startDate must be before or equal to endDate');
        });
    });
});