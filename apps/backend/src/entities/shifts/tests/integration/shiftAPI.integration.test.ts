import request from 'supertest';
import { sequelize } from '../../../../shared/config/db';
import { initializeAssociations } from '../../../../shared/config/associations';
import app from '../../../../app';
import User from '../../../users/user.model';
import Shift from '../../shift.model';
import ShiftSignal from '../../../shift-signals/shiftSignal.model';
import { Pause } from '../../../shift-pauses/pause.model';
import { generateAccessToken } from '../../../auth/utils/generateTokens';

// Set up environment variables for testing
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// Helper function to create authenticated user and get token
async function createAuthenticatedUser(email: string = 'driver@test.com', username: string = 'testdriver') {
    const user = await User.create({
        email,
        username,
        password: 'password123'
    });
    const token = generateAccessToken(user.id);
    return { user, token };
}

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    initializeAssociations();
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // Clean up in correct order due to foreign key constraints
    // Use force: true to hard delete even with paranoid mode
    await ShiftSignal.destroy({ where: {}, force: true });
    await Pause.destroy({ where: {}, force: true });
    await Shift.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
});

afterAll(async () => {
    await sequelize.close();
});


describe('Shift API Integration Tests', () => {

    describe('POST /api/shifts/start-shift', () => {
        it('should return 401 when no authentication provided', async () => {
            // Test POST /api/shifts/start-shift returns 401 when no authentication provided
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/start-shift')
                .send(requestBody);
                
            // Expecting 401 since routes are implemented but require authentication (Green phase)
            expect(res.status).toBe(401);
        });


        it('should return 400 when trying to start shift when already active', async () => {
            // Test authenticated user gets validation error for invalid signal
            const { token } = await createAuthenticatedUser();
            
            // Start first shift
            await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            // Try to start another shift
            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('There is already an active Shift started');
        });


        it('should start shift successfully when authenticated', async () => {
            // Test authenticated user can start shift
            const { token } = await createAuthenticatedUser();
            
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Shift started successfully');
        });
    });


    describe('POST /api/shifts/start-shift - Additional Tests', () => {
        it('should return 200 when authenticated driver starts first shift', async () => {
            // Test authenticated driver can successfully start first shift
            const { token } = await createAuthenticatedUser();
            
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('successfully');
        });
    });


    describe('POST /api/shifts/pause-shift', () => {
        it('should return 401 when no authentication provided', async () => {
            // Test POST /api/shifts/pause-shift returns 401 when no authentication provided
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/pause-shift')
                .send(requestBody);
                
            // Expecting 401 since routes are implemented but require authentication (Green phase)
            expect(res.status).toBe(401);
        });


        it('should return 400 when authenticated driver has no active shift', async () => {
            // Test authenticated driver cannot pause non-existent shift
            const { token } = await createAuthenticatedUser();
            
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/pause-shift')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No active shift');
        });
    });


    describe('POST /api/shifts/continue-shift', () => {
        it('should return 401 when no authentication provided', async () => {
            // Test POST /api/shifts/continue-shift returns 401 when no authentication provided
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/continue-shift')
                .send(requestBody);
                
            // Expecting 401 since routes are implemented but require authentication (Green phase)
            expect(res.status).toBe(401);
        });


        it('should return 400 when authenticated driver has no paused shift', async () => {
            // Test authenticated driver cannot continue non-paused shift
            const { token } = await createAuthenticatedUser();
            
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/continue-shift')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No paused shift');
        });
    });


    describe('POST /api/shifts/end-shift', () => {
        it('should return 401 when no authentication provided', async () => {
            // Test POST /api/shifts/end-shift returns 401 when no authentication provided
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/end-shift')
                .send(requestBody);
                
            // Expecting 401 since routes are implemented but require authentication (Green phase)
            expect(res.status).toBe(401);
        });


        it('should return 400 when authenticated driver has no active shift', async () => {
            // Test authenticated driver cannot end non-existent shift
            const { token } = await createAuthenticatedUser();
            
            const requestBody = {
                timestamp: Date.now()
            };

            const res = await request(app)
                .post('/api/shifts/end-shift')
                .set('Authorization', `Bearer ${token}`)
                .send(requestBody);
                
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('No active shift');
        });
    });


    describe('GET /api/shifts/current', () => {
        it('should return 401 when no authentication provided', async () => {
            // Test GET /api/shifts/current returns 401 when no authentication provided
            const res = await request(app)
                .get('/api/shifts/current');
                
            // Expecting 401 since routes are implemented but require authentication (Green phase)
            expect(res.status).toBe(401);
        });


        it('should return 200 with no shift status when authenticated driver has no shift', async () => {
            // Test authenticated driver with no shift gets appropriate response
            const { token } = await createAuthenticatedUser();

            const res = await request(app)
                .get('/api/shifts/current')
                .set('Authorization', `Bearer ${token}`);
                
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isOnShift).toBe(false);
        });
    });


    describe('Database Constraints', () => {
        it('should prevent multiple active shifts for same driver', async () => {
            // Test that database constraint prevents multiple active shifts per driver
            const { user, token } = await createAuthenticatedUser('driver1@test.com', 'driver1');

            // Create first shift
            const firstShiftRes = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            expect(firstShiftRes.status).toBe(200);

            // Try to create second shift - should fail due to unique constraint
            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('already an active Shift');
        });


        it('should allow new shift after ending previous shift', async () => {
            // Test that driver can start new shift after properly ending previous one
            const { user, token } = await createAuthenticatedUser();

            // Start first shift
            await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() })
                .expect(200);

            // End first shift
            const endRes = await request(app)
                .post('/api/shifts/end-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() })
                .expect(200);
            
            console.log('End shift response:', endRes.body);

            // Wait a bit to ensure database operations complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if shift was actually ended
            const Shift = require('../../shift.model').default;
            const activeShifts = await Shift.findAll({
                where: { driver_id: user.id, shift_end: null }
            });
            console.log('Active shifts after ending:', activeShifts.length);
            if (activeShifts.length > 0) {
                console.log('First active shift:', activeShifts[0].toJSON());
            }

            // Start second shift - should succeed
            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            if (res.status !== 200) {
                console.log('Error starting second shift:', res.body);
            }
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('started successfully');
        });
    });
}); 