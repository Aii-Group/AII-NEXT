import { isNil } from 'lodash-es';

/** 判断值是否不为 null 且不为 undefined */
export function isNotNil<T>(value: T): value is NonNullable<T> {
  return !isNil(value);
}
