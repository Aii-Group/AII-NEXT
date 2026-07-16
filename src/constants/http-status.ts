/** HTTP 状态码 */
export const HttpStatus = {
  // 1xx 信息
  Continue: 100,
  SwitchingProtocols: 101,

  // 2xx 成功
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,

  // 3xx 重定向
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,

  // 4xx 客户端错误
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  UnprocessableEntity: 422,
  TooManyRequests: 429,

  // 5xx 服务端错误
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
} as const;

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

/** 状态码区间 */
export const HttpStatusRange = {
  Informational: { min: 100, max: 199 },
  Success: { min: 200, max: 299 },
  Redirection: { min: 300, max: 399 },
  ClientError: { min: 400, max: 499 },
  ServerError: { min: 500, max: 599 },
} as const;

export type HttpStatusRangeKey = keyof typeof HttpStatusRange;
