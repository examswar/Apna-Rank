export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true as const,
    data,
    error: null,
    ...(meta ? { meta } : {}),
  };
}

export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true as const,
    data,
    error: null,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export function fail(code: string, message: string) {
  return {
    success: false as const,
    data: null,
    error: { code, message },
  };
}
