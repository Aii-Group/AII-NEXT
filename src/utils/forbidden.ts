export const FORBIDDEN_ERROR_NAME = 'ForbiddenError';

export type ForbiddenError = Error & {
  name: typeof FORBIDDEN_ERROR_NAME;
  data?: unknown;
};

type ForbiddenOptions = {
  data?: unknown;
  message?: string;
};

/** 抛出后由 errorComponent / DefaultCatchBoundary 渲染 403 页 */
export function forbidden(options: ForbiddenOptions = {}): ForbiddenError {
  const error = new Error(options.message ?? 'Forbidden') as ForbiddenError;
  error.name = FORBIDDEN_ERROR_NAME;

  if (options.data !== undefined) {
    error.data = options.data;
  }

  return error;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof Error && error.name === FORBIDDEN_ERROR_NAME;
}
