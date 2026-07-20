import { resolveAuthorizationHeader } from '@asiainfo/auth';
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { usePreferenceStore } from '@/store/preference/store';
import { dispatchMicroErrorMessage, isMicroAppEnvironment } from '@/utils/micro';
import { normalizeRequestError } from './http-error';

async function attachCommonHeaders(config: InternalAxiosRequestConfig) {
  const headers = AxiosHeaders.from(config.headers);
  const authorization = await resolveAuthorizationHeader();

  headers.set('Accept-Language', usePreferenceStore.getState().locale);

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  config.headers = headers;
  return config;
}

function rejectNormalizedError(error: unknown) {
  const normalizedError = normalizeRequestError(error);

  if (isMicroAppEnvironment()) {
    const response = axios.isAxiosError(error) ? error.response : undefined;
    const requestConfig = response?.config ?? (axios.isAxiosError(error) ? error.config : undefined);
    const responseData = readResponseErrorData(response?.data);

    dispatchMicroErrorMessage({
      status: response?.status,
      errorCode: responseData?.code ?? normalizedError.code,
      httpMethod: requestConfig?.method?.toUpperCase(),
      rawUrl: requestConfig?.url,
      placeholderMapping: readPlaceholderMapping(responseData?.args),
      errorMsg: readErrorMessage(responseData) ?? normalizedError.message,
    });
  } else {
    window.$message?.error(normalizedError.message);
  }

  return Promise.reject(normalizedError);
}

interface ResponseErrorData {
  code?: unknown;
  message?: unknown;
  msg?: unknown;
  args?: unknown;
}

function readResponseErrorData(data: unknown): ResponseErrorData | undefined {
  return typeof data === 'object' && data !== null ? (data as ResponseErrorData) : undefined;
}

function readErrorMessage(data: ResponseErrorData | undefined): string | undefined {
  const message = data?.message ?? data?.msg;
  return typeof message === 'string' && message.length > 0 ? message : undefined;
}

function readPlaceholderMapping(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export const apiInterceptors = {
  request: {
    onFulfilled: attachCommonHeaders,
  },
  response: {
    onRejected: rejectNormalizedError,
  },
};
