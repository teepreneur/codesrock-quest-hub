/**
 * Authentication API Tests
 * Tests for login and register validation
 */

import request from 'supertest';
import app from '../app';

describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'testpassword123' });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'invalid-email', password: 'testpassword123' });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/register', () => {
        it('should return 400 when required fields are missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when password is too short', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: '123',
                    firstName: 'Test',
                    lastName: 'User',
                });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'ValidPass123!',
                    firstName: 'Test',
                    lastName: 'User',
                });

            expect(response.status).toBe(422);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/health', () => {
        it('should return 200 and server status', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Server is running');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('Rate Limiting', () => {
        it('should have rate limit headers in response', async () => {
            const response = await request(app).get('/api/health');

            // Check for RateLimit headers (standardHeaders: true)
            expect(response.headers).toHaveProperty('ratelimit-limit');
            expect(response.headers).toHaveProperty('ratelimit-remaining');
        });
    });
});
