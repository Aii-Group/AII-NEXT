import type { Breakpoint } from 'antd';
import type { AIISearchResponsiveCols } from './types';

/** 24 栅格总列数 */
export const GRID_COLUMNS = 24;

/** 默认最大每行列数 */
export const DEFAULT_MAX_COLS = 8;

export const RESPONSIVE_BREAKPOINTS: readonly Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];

export const RESPONSIVE_BREAKPOINTS_DESC: readonly Breakpoint[] = ['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs'];

/** 默认是否收起 */
export const DEFAULT_COLLAPSED = true;

/** 按 antd 响应式断点自适应每行列数 */
export const DEFAULT_RESPONSIVE_COLS: Readonly<Required<AIISearchResponsiveCols>> = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
  xxl: 6,
  xxxl: 8,
};

/** 默认 Row gutter：[水平, 垂直]；垂直间距替代 Form.Item 默认 marginBottom */
export const DEFAULT_GUTTER: [number, number] = [16, 16];
