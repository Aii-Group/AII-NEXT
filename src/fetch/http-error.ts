import axios from 'axios';

export interface RequestError<TData = unknown> {
  message: string;
  status?: number;
  code?: string;
  data?: TData;
  raw?: unknown;
}

function readErrorMessage(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    return undefined;
  }

  const payload = data as { message?: unknown; msg?: unknown; error?: unknown };
  const message = payload.message ?? payload.msg ?? payload.error;

  return typeof message === 'string' && message.length > 0 ? message : undefined;
}

export function normalizeRequestError<TData = unknown>(error: unknown): RequestError<TData> {
  if (axios.isAxiosError<TData>(error)) {
    return {
      message: readErrorMessage(error.response?.data) ?? error.message,
      status: error.response?.status,
      code: error.code,
      data: error.response?.data,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      raw: error,
    };
  }

  return {
    message: String(error),
    raw: error,
  };
}
