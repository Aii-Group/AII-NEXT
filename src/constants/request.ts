/** HTTP 请求方法 */
export const RequestMethod = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
  Head: 'HEAD',
  Options: 'OPTIONS',
} as const;

export type RequestMethod = (typeof RequestMethod)[keyof typeof RequestMethod];

export const REQUEST_METHODS = [
  RequestMethod.Get,
  RequestMethod.Post,
  RequestMethod.Put,
  RequestMethod.Patch,
  RequestMethod.Delete,
  RequestMethod.Head,
  RequestMethod.Options,
] as const;

/** 请求体类型 */
export const RequestContentType = {
  Json: 'application/json',
  Form: 'application/x-www-form-urlencoded',
  Multipart: 'multipart/form-data',
  Text: 'text/plain',
} as const;

export type RequestContentType = (typeof RequestContentType)[keyof typeof RequestContentType];
