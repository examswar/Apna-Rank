export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class MinorRestrictedError extends AppError {
  constructor() {
    super(403, 'MINOR_RESTRICTED', 'Yeh feature 18+ ke liye hai');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, 'VALIDATION_ERROR', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Bahut zyada requests. Thoda ruko.') {
    super(429, 'RATE_LIMIT', message);
  }
}

export class DpaRequiredError extends AppError {
  constructor() {
    super(403, 'DPA_REQUIRED', 'Minor students ke liye DPA sign karna zaroori hai');
  }
}
