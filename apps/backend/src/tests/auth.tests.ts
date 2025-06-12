import request from 'supertest';
import { sequelize } from '../config/db';
import app from '../app';
import User from '../models/userModel';
import { generateRefreshToken } from '../utils/generateTokens';

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

    it('→ 400 if missing email/username/password', async () => {
      const cases = [
        { body: { username: 'u', password: 'password123' }, missing: 'email' },
        { body: { email: 'a@b.com', password: 'password123' }, missing: 'username' },
        { body: { email: 'a@b.com', username: 'u' }, missing: 'password' },
      ];
      for (const c of cases) {
        const res = await request(app)
          .post('/api/auth/signup')
          .send(c.body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Please provide all fields');
      }
    });

    it('→ 400 if invalid email or short password', async () => {
      // invalid email
      let res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'not-an-email', username: 'u', password: 'password123' });
      expect(res.status).toBe(400);

      // password too short
      res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'a@b.com', username: 'u', password: 'short' });
      expect(res.status).toBe(400);
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

    it('→ 400 if email not registered', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'noone@nowhere.com',
          password: 'whatever123'
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('→ 400 if missing email or password', async () => {
      const cases = [
        { body: { password: 'password123' } },
        { body: { email: 'a@b.com' } },
      ];
      for (const c of cases) {
        const res = await request(app)
          .post('/api/auth/signin')
          .send(c.body);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid email or password');
      }
    });

    it('→ sets an HTTP-only refreshToken cookie on signin', async () => {
      await User.create({ email:'a@b.com', username:'u', password:'password123' });
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ email:'a@b.com', password:'password123' });
      const cookies = res.headers['set-cookie'][0];
      expect(cookies).toMatch(/refreshToken=/);
      expect(cookies).toMatch(/HttpOnly/);
      expect(cookies).toMatch(/Path=\/api\/auth\/refresh/);
    });

  });

  describe('POST /api/auth/refresh', () => {

    it('→ 401 if no cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No refresh token');
    });

    it('→ 403 if cookie invalid', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=bad.token.here']);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid refresh token');
    });

    it('→ 200 and returns new access token', async () => {
      const user = await User.create({
        email:'c@d.com',
        username:'c',
        password:'password123'
      });
      const refresh = generateRefreshToken(user.id);
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refresh}`]);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

  });

});
