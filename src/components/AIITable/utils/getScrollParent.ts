const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/;

function isScrollable(element: HTMLElement) {
  const { overflow, overflowY, overflowX } = getComputedStyle(element);
  const overflowValue = `${overflow} ${overflowY} ${overflowX}`;
  if (!SCROLLABLE_OVERFLOW.test(overflowValue)) return false;

  return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

function getDefaultScrollContainer(): HTMLElement {
  return document.querySelector('main') ?? document.documentElement;
}

/** 向上查找最近的可滚动祖先，用于 sticky 表头的滚动容器 */
export function getScrollParent(node: HTMLElement | null): HTMLElement {
  if (typeof window === 'undefined') {
    return null as unknown as HTMLElement;
  }

  if (!node) return getDefaultScrollContainer();

  let parent = node.parentElement;
  while (parent) {
    if (isScrollable(parent)) return parent;
    parent = parent.parentElement;
  }

  return getDefaultScrollContainer();
}
