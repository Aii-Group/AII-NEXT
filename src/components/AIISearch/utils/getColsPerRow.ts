import type { Breakpoint, ColProps } from 'antd';
import { DEFAULT_MAX_COLS, DEFAULT_RESPONSIVE_COLS, GRID_COLUMNS, RESPONSIVE_BREAKPOINTS, RESPONSIVE_BREAKPOINTS_DESC } from '../constants';
import type { AIISearchResponsiveCols } from '../types';

type ScreenMap = Partial<Record<Breakpoint, boolean>>;

function clampCols(cols: number, maxCols: number): number {
  return Math.max(1, Math.min(Math.floor(cols), maxCols, GRID_COLUMNS));
}

/**
 * 将每行列数转换为 antd Col `span`。
 * 无法整除 24 时向下取整，避免溢出换行。
 */
function getItemSpan(colsPerRow: number): number {
  return Math.max(1, Math.floor(GRID_COLUMNS / Math.max(1, colsPerRow)));
}

export function resolveResponsiveCols(
  cols: AIISearchResponsiveCols | undefined,
  maxCols: number = DEFAULT_MAX_COLS,
): Required<AIISearchResponsiveCols> {
  const resolved = {} as Required<AIISearchResponsiveCols>;

  for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
    resolved[breakpoint] = clampCols(cols?.[breakpoint] ?? DEFAULT_RESPONSIVE_COLS[breakpoint], maxCols);
  }

  return resolved;
}

export function getResponsiveColProps(responsiveCols: Required<AIISearchResponsiveCols>): ColProps {
  const colProps: ColProps = {};

  for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
    colProps[breakpoint] = getItemSpan(responsiveCols[breakpoint]);
  }

  return colProps;
}

export function getActiveResponsiveColsPerRow(
  responsiveCols: Required<AIISearchResponsiveCols>,
  screens: ScreenMap,
  fallbackCols: number,
): number {
  for (const breakpoint of RESPONSIVE_BREAKPOINTS_DESC) {
    if (screens[breakpoint]) return responsiveCols[breakpoint];
  }

  return fallbackCols;
}
