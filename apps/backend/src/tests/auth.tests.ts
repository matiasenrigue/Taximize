import request from 'supertest';
import { sequelize } from '../config/db';
import app from '../app';
import User from '../models/userModel';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth API (SQL)', () => {

  describe('POST /api/auth/signup', () => {

    it('→ 201 and returns userId & username on success', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data.username).toBe('testuser');
    });

    it('→ 400 if email already exists', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'foo',
        password: 'password123'
      });
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'otheruser',
          password: 'password123'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User with this email already exists');
    });
  });


  describe('POST /api/auth/signin', () => {
    
    it('→ 200 and returns token on valid creds', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User logged in successfully');
      expect(res.body.data).toHaveProperty('token');
    });

    it('→ 400 on invalid credentials', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });
  });
});
