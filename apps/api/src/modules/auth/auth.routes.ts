import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response';
import { config } from '../../lib/config';
import { authenticate } from '../../middleware/authenticate';
import * as AuthService from './auth.service';

const sendOtpBody = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

const verifyOtpBody = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
  name: z.string().min(2).max(255).optional(), // required for first-time signup
  dob: z.string().date().optional(),           // YYYY-MM-DD — triggers age-gate if <18
});

const selectRoleBody = z.object({
  role: z.enum(['student', 'teacher', 'institute_admin']),
});

const dobBody = z.object({
  dob: z.string().date(), // YYYY-MM-DD
});

const consentBody = z.object({
  minorUserId: z.string().uuid(),
  guardianPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
});

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/otp/send
  // Rate limited to 3 per phone per 15 minutes (enforced in service)
  app.post('/otp/send', async (request, reply) => {
    const body = sendOtpBody.parse(request.body);
    await AuthService.sendOtp(body.phone);
    return reply.status(200).send(ok({ message: 'OTP sent' }));
  });

  // POST /api/v1/auth/otp/verify
  // Issues access token (15m) + sets httpOnly refresh cookie (7d)
  app.post('/otp/verify', async (request, reply) => {
    const body = verifyOtpBody.parse(request.body);
    const result = await AuthService.verifyOtpAndIssueTokens(body, app);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });
    return reply.status(200).send(ok({ accessToken: result.accessToken, user: result.user }));
  });

  // POST /api/v1/auth/refresh
  // Reads httpOnly cookie, rotates both tokens (refresh token rotation)
  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies['refresh_token'];
    const result = await AuthService.rotateTokens(refreshToken, app);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });
    return reply.status(200).send(ok({ accessToken: result.accessToken }));
  });

  // POST /api/v1/auth/logout
  app.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    const refreshToken = request.cookies['refresh_token'];
    await AuthService.revokeRefreshToken(refreshToken);
    reply.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    return reply.status(200).send(ok({ message: 'Logged out' }));
  });

  // GET /api/v1/auth/me
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await AuthService.getCurrentUser(request.user.id);
    return reply.status(200).send(ok(user));
  });

  // POST /api/v1/auth/select-role
  // Sets user role (STUDENT / TEACHER / INSTITUTE_ADMIN) and re-issues tokens.
  app.post('/select-role', { preHandler: authenticate }, async (request, reply) => {
    const body = selectRoleBody.parse(request.body);
    const result = await AuthService.selectRole(request.user.id, body.role, app);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });
    return reply.status(200).send(ok({ accessToken: result.accessToken, user: result.user }));
  });

  // POST /api/v1/auth/dob
  // Accepts DOB, computes isMinor flag, re-issues tokens with updated claim.
  app.post('/dob', { preHandler: authenticate }, async (request, reply) => {
    const body = dobBody.parse(request.body);
    const result = await AuthService.setDob(request.user.id, body.dob, app);
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });
    return reply.status(200).send(ok({ accessToken: result.accessToken, isMinor: result.isMinor }));
  });

  // POST /api/v1/auth/consent
  // Guardian submits parental consent for a minor (DPDP Act 2023). No auth required.
  app.post('/consent', async (request, reply) => {
    const body = consentBody.parse(request.body);
    const result = await AuthService.submitParentalConsent(body.minorUserId, body.guardianPhone);
    return reply.status(201).send(ok(result));
  });
}
