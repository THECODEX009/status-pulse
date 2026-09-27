import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Subscription } from '../models/Subscription.js';

const app = createApp();

describe('Auth Endpoints Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/statuspulse_test';
    try {
      await mongoose.connect(mongoUri);
    } catch (err) {
      console.warn('MongoDB not running locally during test execution.');
    }
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Organization.deleteMany({});
      await Subscription.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  it('should register a new organization and admin user', async () => {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Developer',
        email: 'jane@enterprise.com',
        password: 'SecurePassword123!',
        organizationName: 'Acme Corp',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('jane@enterprise.com');
    expect(res.body.user.role).toBe('Admin');
  });

  it('should login an existing user', async () => {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Developer',
        email: 'jane@enterprise.com',
        password: 'SecurePassword123!',
        organizationName: 'Acme Corp',
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'jane@enterprise.com',
        password: 'SecurePassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('jane@enterprise.com');
  });
});
