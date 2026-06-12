export type UserRole = 'student' | 'teacher' | 'institute_admin' | 'platform_admin';

export interface JwtPayload {
  sub: string;          // user UUID
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

// @fastify/jwt augmentation — the official way to type request.user
// This replaces the conflicting `declare module 'fastify'` approach
// (which clashes with @fastify/jwt's own `user: string|object|Buffer` declaration)
declare module '@fastify/jwt' {
  interface FastifyJWT {
    // payload = what you pass to sign() — iat/exp are added by the library
    payload: Omit<JwtPayload, 'iat' | 'exp'>;
    // user = what request.user contains after jwtVerify()
    user: RequestUser;
  }
}

// Standard API response envelopes
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
