import 'fastify';

export type UserRole = 'student' | 'teacher' | 'institute_admin' | 'platform_admin';

export interface JwtPayload {
  sub: string;           // user UUID
  role: UserRole;
  isMinor: boolean;
  examCategory: string | null;
  instituteId: string | null;
  iat: number;
  exp: number;
}

export interface RequestUser {
  id: string;
  role: UserRole;
  isMinor: boolean;
  examCategory: string | null;
  instituteId: string | null;
}

// Fastify module augmentation — makes request.user available everywhere.
// Also augment @fastify/jwt so request.user resolves through the JWT plugin's
// typing chain (required in @fastify/jwt v10+).
declare module 'fastify' {
  interface FastifyRequest {
    user: RequestUser;
    rawBody?: Buffer; // populated by the webhook plugin's scoped content-type parser
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: RequestUser;
  }
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  data: null;
  error: { code: string; message: string };
}
