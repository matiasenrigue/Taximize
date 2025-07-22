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

// had issues with tokens before when testing on GH, keeping these hardcoded for now

// copied from auth tests
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
    await ShiftSignal.destroy({ where: {}, force: true });
    await Pause.destroy({ where: {}, force: true });
    await Shift.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true }); // users last because FK
});

afterAll(async () => {
    await sequelize.close();
});


describe('Shift API', () => {

    describe('POST /api/shifts/start-shift', () => {

        it('needs auth', async () => {
            const res = await request(app)
                .post('/api/shifts/start-shift')
                .send({ timestamp: Date.now() });
                
            expect(res.status).toBe(401);
        });


        it('cant start twice', async () => {
            const { token } = await createAuthenticatedUser();
            
            // first one works
            await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            // second one should fail
            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('already an active Shift'); // close enough
        });


        it('happy path - starts shift', async () => {
            const { token } = await createAuthenticatedUser();

            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('successfully');
        });
    });



    describe('POST /api/shifts/pause-shift', () => {

        it('pause needs auth too', async () => {
            const res = await request(app)
                .post('/api/shifts/pause-shift')
                .send({ timestamp: Date.now() });
                
            expect(res.status).toEqual(401);
        });

        it('cant pause without shift', async () => {
            const { token } = await createAuthenticatedUser('pausetest@example.com', 'pauseguy');

            const res = await request(app)
                .post('/api/shifts/pause-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('No active shift'); // cant pause nothing
        });
    
    });


    describe('POST /api/shifts/continue-shift', () => {
        
        // basically copy pasted from pause tests
        it('401 without auth', async () => {
            const response = await request(app)
                .post('/api/shifts/continue-shift')
                .send({ timestamp: Date.now() });
                
            expect(response.status).toBe(401);
        });

        it('400 when not paused', async () => {
            const { token } = await createAuthenticatedUser('continue@test.com', 'continueguy');

            const response = await request(app)
                .post('/api/shifts/continue-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            expect(response.body.success).toBe(false); // should fail
            expect(response.body.error).toContain('No paused');
        });
    });

    describe('POST /api/shifts/end-shift', () => {

        it('end shift requires active shift', async () => {
            const { token } = await createAuthenticatedUser('endtest@test.com', 'enduser');
            
            const res = await request(app)
                .post('/api/shifts/end-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/active shift/i); // case insensitive
        });
    
    });


    describe('GET /api/shifts/current ', () => {

        it('works', async () => {
            const { token } = await createAuthenticatedUser('status@test.com', 'statuschecker');

            const res = await request(app)
                .get('/api/shifts/current')
                .set('Authorization', `Bearer ${token}`);
                
            expect(res.status).toBe(200);
            expect(res.body.data.isOnShift).toBe(false); // no shift started
        });
    });


    describe('Database Constraints', () => {

        it('db prevents duplicate active shifts', async () => {
            const { user, token } = await createAuthenticatedUser('dbtest@example.com', 'dbconstraint');

            // start shift
            await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() })
                .expect(200);

            // try again - should blow up
            const res = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            expect(res.body.success).toBe(false); // nope
            expect(res.body.error).toContain('already');
        });


        it('can start new shift after ending old one', async () => {
            // debugging this test rn
            const { user, token } = await createAuthenticatedUser('restart@test.com', 'restarter');

            // 1. start
            await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() })
                .expect(200);

            // 2. stop
            const endRes = await request(app)
                .post('/api/shifts/end-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });
                
            console.log('DEBUG end response:', endRes.body); // keeping this for now
            expect(endRes.status).toBe(200); // should work

            // hack: wait for db
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // debugging - check db state
            const Shift = require('../../shift.model').default;
            const activeShifts = await Shift.findAll({
                where: { driver_id: user.id, shift_end: null }
            });
            console.log('Active shifts:', activeShifts.length);

            // 3. start again
            const newShift = await request(app)
                .post('/api/shifts/start-shift')
                .set('Authorization', `Bearer ${token}`)
                .send({ timestamp: Date.now() });

            expect(newShift.status).toBe(200); 
            expect(newShift.body.message).toContain('started');
        });

    });

});
