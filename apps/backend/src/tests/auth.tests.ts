import request from 'supertest';
import app from '../src/app';

describe('Auth API', () => {
  it('POST /api/auth/signup → 201 on success', async () => { /*...*/ });
  it('POST /api/auth/signup → 400 if email exists', async () => { /*...*/ });
  it('POST /api/auth/signin → 200 with token', async () => { /*...*/ });
  it('POST /api/auth/signin → 400 on bad creds', async () => { /*...*/ });
});
