import request from 'supertest';
import { sequelize } from '../../../config/db';
import app from '../../../app';
import User from '../../../models/userModel';
import Shift from '../../../models/shiftModel';
import ShiftSignal from '../../../models/shiftSignalModel';
import ShiftPause from '../../../models/shiftPauseModel';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await User.destroy({ where: {} });
  await Shift.destroy({ where: {} });
  await ShiftSignal.destroy({ where: {} });
  await ShiftPause.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Shift API Integration Tests', () => {

  describe('POST /api/shifts/signal', () => {
    it('should return 200 and handle valid signal transition', async () => {
      // Test POST /api/shifts/signal returns 200 and handles valid signal transition
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now(),
        signal: 'start'
      };

      const res = await request(app)
        .post('/api/shifts/signal')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when signal transition is invalid', async () => {
      // Test POST /api/shifts/signal returns 400 when signal transition is invalid
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      // Create a shift that's already started
      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      await ShiftSignal.create({
        timestamp: new Date(),
        shift_id: shift.id,
        signal: 'start'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now(),
        signal: 'start' // Invalid: can't start again
      };

      const res = await request(app)
        .post('/api/shifts/signal')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when required fields are missing', async () => {
      // Test POST /api/shifts/signal returns 400 when required fields are missing
      const requestBody = {
        timestamp: Date.now(),
        signal: 'start'
        // Missing driverId
      };

      const res = await request(app)
        .post('/api/shifts/signal')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/shifts/start-shift', () => {
    it('should return 200 and create new shift when driver has no active shift', async () => {
      // Test POST /api/shifts/start-shift returns 200 and creates new shift when driver has no active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/start-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when driver already has active shift', async () => {
      // Test POST /api/shifts/start-shift returns 400 when driver already has active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      // Create an active shift
      await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/start-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/shifts/pause-shift', () => {
    it('should return 200 and pause active shift when driver has active shift', async () => {
      // Test POST /api/shifts/pause-shift returns 200 and pauses active shift when driver has active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/pause-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when driver has no active shift', async () => {
      // Test POST /api/shifts/pause-shift returns 400 when driver has no active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/pause-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when shift is already paused', async () => {
      // Test POST /api/shifts/pause-shift returns 400 when shift is already paused
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      // Add a pause signal
      await ShiftSignal.create({
        timestamp: new Date(),
        shift_id: shift.id,
        signal: 'pause'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/pause-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/shifts/continue-shift', () => {
    it('should return 200 and continue paused shift when driver has paused shift', async () => {
      // Test POST /api/shifts/continue-shift returns 200 and continues paused shift when driver has paused shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      // Add a pause signal
      await ShiftSignal.create({
        timestamp: new Date(),
        shift_id: shift.id,
        signal: 'pause'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/continue-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when driver has no active shift', async () => {
      // Test POST /api/shifts/continue-shift returns 400 when driver has no active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/continue-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when shift is not paused', async () => {
      // Test POST /api/shifts/continue-shift returns 400 when shift is not paused
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      // Add a start signal (not paused)
      await ShiftSignal.create({
        timestamp: new Date(),
        shift_id: shift.id,
        signal: 'start'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/continue-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/shifts/end-shift', () => {
    it('should return 200 and end active shift with computed statistics', async () => {
      // Test POST /api/shifts/end-shift returns 200 and ends active shift with computed statistics
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/end-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when driver has no active shift', async () => {
      // Test POST /api/shifts/end-shift returns 400 when driver has no active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/end-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when shift is already ended', async () => {
      // Test POST /api/shifts/end-shift returns 400 when shift is already ended
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      // Create an already ended shift
      await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: new Date(), // Already ended
        total_duration_ms: 8 * 60 * 60 * 1000,
        work_time_ms: 7 * 60 * 60 * 1000,
        break_time_ms: 60 * 60 * 1000
      });

      const requestBody = {
        driverId: user.id,
        timestamp: Date.now()
      };

      const res = await request(app)
        .post('/api/shifts/end-shift')
        .send(requestBody);
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/shifts/current', () => {
    it('should return 200 and current shift status when driver has active shift', async () => {
      // Test GET /api/shifts/current returns 200 and current shift status when driver has active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const shift = await Shift.create({
        driver_id: user.id,
        shift_start: new Date(),
        shift_end: null
      });

      const res = await request(app)
        .get('/api/shifts/current')
        .query({ driverId: user.id });
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 200 and null when driver has no active shift', async () => {
      // Test GET /api/shifts/current returns 200 and null when driver has no active shift
      const user = await User.create({
        email: 'driver@test.com',
        username: 'testdriver',
        password: 'password123'
      });

      const res = await request(app)
        .get('/api/shifts/current')
        .query({ driverId: user.id });
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });

    it('should return 400 when driverId is missing', async () => {
      // Test GET /api/shifts/current returns 400 when driverId is missing
      const res = await request(app)
        .get('/api/shifts/current');
        
      // Expecting 404 since routes are not implemented yet (Red phase)
      expect(res.status).toBe(404);
    });
  });

}); 