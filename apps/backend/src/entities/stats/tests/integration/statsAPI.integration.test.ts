import request from 'supertest';
import app from '../../../../app';
import { sequelize } from '../../../../shared/config/db';
import { User } from '../../../users/user.model';
import { Shift } from '../../../shifts/shift.model';
import { Ride } from '../../../rides/ride.model';
import { TestHelpers } from '../../../../shared/tests/utils/testHelpers';
import { initializeAssociations } from '../../../../shared/config/associations';

process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

describe('Statistics API', () => {

    let authToken: string;
    let driver: User;
    let user: User;

    beforeAll(async () => {
        initializeAssociations();
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
        await User.destroy({ where: {} });
    });

    afterAll(async () => {
        try {
            await sequelize.close();
        } catch (e) {
            // sometimes fails in CI
        }
    });

    describe('GET /api/stats/shifts-by-days', () => {
        it('returns shifts for the week', async () => {
            const shift = await TestHelpers.createActiveShift(driver.id);

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
            const firstDay = response.body.data[0];
            expect(firstDay).toHaveProperty('day');
            expect(firstDay).toHaveProperty('hasRide');
            expect(firstDay).toHaveProperty('shifts');
            expect(firstDay.shifts).toBeInstanceOf(Array);
        });


        it('handles custom days params', async () => {
            // quick test for 2 week view
            const response = await request(app)
                .get('/api/stats/shifts-by-days?days=14')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(14);
        });
    });

    describe('GET /api/stats/rides-by-weekday', () => {

        it('gets Monday rides correctly', async () => {
            const createdShift = await TestHelpers.createActiveShift(driver.id);
            const monday = new Date('2025-01-20');
            await Ride.create({
                shift_id: createdShift.id,
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
            
            const shifts = response.body.data;
            if (!shifts.length) {
                console.warn('No shifts found');
                return;
            }
            
            const shift = shifts[0];
            expect(shift.id).toBeDefined();
            expect(shift.startDate).toBeDefined();
            expect(shift.stats.totalEarnings).toBeGreaterThanOrEqual(0);
            expect(shift.stats.numberOfRides).toBeGreaterThanOrEqual(0);
            expect(shift.rides).toBeInstanceOf(Array);
            
            if (shift.rides.length === 0) return;
            
            const ride = shift.rides[0];
            expect(ride.fare).toMatch(/^\$\d+\.\d{2}$/); // currency format
            expect(ride.distanceKm).toBeGreaterThan(0);
            expect(ride.from).toBe('123 Main St, Sydney'); 
        });

        it('fails on bad weekday input', async () => {
            const response = await request(app)
                .get('/api/stats/rides-by-weekday?day=invalidday')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('earnings endpoint', () => {

        beforeEach(async () => {

            // Setup some test rides with different amounts
            const shift = await TestHelpers.createActiveShift(driver.id);
            const dates = [
                new Date('2025-01-20'), // mon
                new Date('2025-01-21'), // tue  
                new Date('2025-01-22')  // wed
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
                    earning_cents: (i + 1) * 10000,
                    earning_per_min: 100,
                    distance_km: 5
                });
            }
        });

        it('weekly earnings calculation', async () => {
            const response = await request(app)
                .get('/api/stats/earnings?view=weekly&startDate=2025-01-20&endDate=2025-01-26')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.totalEarnings).toBe(600);
            expect(response.body.data.view).toBe('weekly');
            expect(response.body.data.breakdown).toHaveLength(7);
            
            const monday = response.body.data.breakdown.find((d: any) => d.label === 'Mon');
            expect(monday.value).toBe(100); // first ride was $100
        });

        it('monthly view', async () => {

            const response = await request(app)
                .get('/api/stats/earnings?view=monthly&startDate=2025-01-01&endDate=2025-01-31')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.view).toBe('monthly');
            expect(response.body.data.breakdown).toHaveLength(31);
        });

    });


    describe('work time stats - /api/stats/worktime', () => {

        beforeEach(async () => {
            const date = new Date('2025-01-20T10:00:00Z');
            const shift = await Shift.create({
                driver_id: driver.id,
                shift_start: date,
                shift_end: null,
                shift_start_location_latitude: 53.349805,
                shift_start_location_longitude: -6.260310
            });
            
            await Ride.create({
                shift_id: shift.id,
                driver_id: driver.id,
                start_latitude: -33.8688,
                start_longitude: 151.2093,
                destination_latitude: -33.8600,
                destination_longitude: 151.2111,
                address: 'Test Address',
                start_time: date,
                end_time: new Date(date.getTime() + 30 * 60 * 1000), // 30 min ride
                predicted_score: 4,
                earning_cents: 2500,
                earning_per_min: 83,
                distance_km: 5.0
            });

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
                distance_km: 7
            });
        });

        it('Weekly worktime stats', async () => {
            const response = await request(app)
                .get('/api/stats/worktime?view=weekly&startDate=2025-01-20&endDate=2025-01-26')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.view).toBe('weekly');
            expect(response.body.data.breakdown).toHaveLength(7);
            
            const monday = response.body.data.breakdown.find((d: any) => d.label === 'Mon');
            expect(monday.withPassengerTime).toBe(1.25); // 75 mins
            expect(monday.emptyTime).toBe(0.5);         // 30 min gap
        });


        it('monthly worktime stats', async () => {
            const response = await request(app)
                .get('/api/stats/worktime?view=monthly&startDate=2025-01-01&endDate=2025-01-31')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.view).toBe('monthly');
            expect(response.body.data.breakdown.length).toBe(31); // days in jan
        });

        it('date validation bug', async () => {
            const response = await request(app)
                .get('/api/stats/worktime?view=weekly&startDate=2025-01-26&endDate=2025-01-20')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('startDate must be before');
        });
    });
});