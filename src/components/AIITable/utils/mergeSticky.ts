import type { RefObject } from 'react';
import type { TableProps } from 'antd';
import { getScrollParent } from './getScrollParent';

type StickyProp = TableProps['sticky'];

export function mergeSticky(sticky: StickyProp, containerRef: RefObject<HTMLElement | null>): StickyProp {
  if (sticky === false) return false;

  const resolveContainer = () => getScrollParent(containerRef.current);

  if (sticky === undefined || sticky === true) {
    return { getContainer: resolveContainer };
  }

  return {
    ...sticky,
    getContainer: sticky.getContainer ?? resolveContainer,
  };
}
