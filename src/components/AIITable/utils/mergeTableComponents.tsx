import type { HTMLAttributes, ReactNode, ElementType } from 'react';
import type { TableProps } from 'antd';

interface MergeTableComponentsOptions {
  alert: ReactNode | null;
  colSpan: number;
  virtual?: boolean;
}

type TableBodyWrapperProps = HTMLAttributes<HTMLTableSectionElement> & {
  children?: ReactNode;
};

export function mergeTableComponents<RecordType extends object>(
  components: TableProps<RecordType>['components'],
  { alert, colSpan, virtual }: MergeTableComponentsOptions,
): TableProps<RecordType>['components'] {
  if (!alert || virtual) return components;

  const userBody = components?.body;
  if (typeof userBody === 'function') return components;

  const userWrapper = typeof userBody === 'object' ? userBody.wrapper : undefined;

  const wrapper = (wrapperProps: TableBodyWrapperProps) => {
    const Wrapper = (userWrapper ?? 'tbody') as ElementType;

    return (
      <Wrapper {...wrapperProps}>
        <tr className='ant-table-selection-alert-row'>
          <td
            colSpan={colSpan}
            className='p-0!'
          >
            {alert}
          </td>
        </tr>
        {wrapperProps.children}
      </Wrapper>
    );
  };

  return {
    ...components,
    body: {
      ...(typeof userBody === 'object' ? userBody : {}),
      wrapper,
    },
  };
}

export function getTableColSpan(
  columnCount: number,
  options: {
    hasSelection?: boolean;
    hasExpand?: boolean;
  },
): number {
  let span = columnCount;
  if (options.hasSelection) span += 1;
  if (options.hasExpand) span += 1;
  return span;
}
