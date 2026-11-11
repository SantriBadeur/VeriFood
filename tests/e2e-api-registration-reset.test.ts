import { describe, it, expect } from 'vitest';
import * as RegisterRoute from '../src/app/api/auth/register/route';
import * as ForgotPasswordRoute from '../src/app/api/auth/forgot-password/route';
import * as ResetPasswordRoute from '../src/app/api/auth/reset-password/route';

describe('E2E Auth API - Register & Password Reset Routes', () => {
  const regEmail = `api_volunteer_${Date.now()}@test.org`;
  let resetToken = '';

  describe('POST /api/auth/register', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });
      const res = await RegisterRoute.POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('should return 201 and enforce role RELAWAN even if client sends ADMIN', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Api Volunteer',
          email: regEmail,
          password: 'password123',
          role: 'ADMIN', // Review Focus 1: Client tries privilege escalation
        }),
      });
      const res = await RegisterRoute.POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.role).toBe('RELAWAN');
    });

    it('should return 400 on duplicate email', async () => {
      const req = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Api Duplicate',
          email: regEmail,
          password: 'password123',
        }),
      });
      const res = await RegisterRoute.POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Email sudah terdaftar');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 if email is missing', async () => {
      const req = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await ForgotPasswordRoute.POST(req);
      expect(res.status).toBe(400);
    });

    it('should return 200 for unknown email without leaking existence', async () => {
      const req = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unknown@nowhere.com' }),
      });
      const res = await ForgotPasswordRoute.POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.devResetUrl).toBeUndefined();
    });

    it('should return 200 and devResetUrl for existing user in development', async () => {
      const req = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail }),
      });
      const res = await ForgotPasswordRoute.POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.devResetUrl).toBeDefined();

      const url = new URL(json.devResetUrl);
      resetToken = url.searchParams.get('token') || '';
      expect(resetToken.length).toBeGreaterThan(10);
    });
  });

  describe('GET & POST /api/auth/reset-password', () => {
    it('GET should return 400 if token param is missing', async () => {
      const req = new Request('http://localhost:3000/api/auth/reset-password');
      const res = await ResetPasswordRoute.GET(req);
      expect(res.status).toBe(400);
    });

    it('GET should return 200 with valid=true when token is valid', async () => {
      const req = new Request(`http://localhost:3000/api/auth/reset-password?token=${resetToken}`);
      const res = await ResetPasswordRoute.GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.valid).toBe(true);
      expect(json.email).toBe(regEmail.toLowerCase());
    });

    it('POST should return 200 on successful password reset', async () => {
      const req = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'newApiPassword123',
        }),
      });
      const res = await ResetPasswordRoute.POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('POST should return 400 on replaying used reset token', async () => {
      const req = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'anotherPassword123',
        }),
      });
      const res = await ResetPasswordRoute.POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });
});
