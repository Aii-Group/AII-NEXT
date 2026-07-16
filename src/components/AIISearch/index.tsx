import { memo, useCallback, useMemo, useState, type CSSProperties, type ReactElement } from 'react';
import { Col, Form, Grid, Row } from 'antd';
import type { ColProps, FormInstance, RowProps } from 'antd';
import { motion } from 'motion/react';
import { cn } from '@/utils/classnames';
import { LayoutWrapper } from '@/components/Wrapper';
import { motionConfig } from '@/lib/motion-config';
import { motionTokens } from '@/lib/motion-tokens';
import { SearchActions } from './components/SearchActions';
import { DEFAULT_COLLAPSED, DEFAULT_GUTTER, DEFAULT_MAX_COLS, GRID_COLUMNS } from './constants';
import { getActiveResponsiveColsPerRow, getResponsiveColProps, resolveResponsiveCols } from './utils/getColsPerRow';
import { splitSearchItem } from './utils/splitSearchItem';
import type { AIISearchItem, AIISearchProps } from './types';

export type { AIISearchActionRenderContext, AIISearchItem, AIISearchProps } from './types';
export { DEFAULT_COLLAPSED, DEFAULT_GUTTER, DEFAULT_MAX_COLS, DEFAULT_RESPONSIVE_COLS, GRID_COLUMNS } from './constants';

function resolveItemKey<Values>(item: AIISearchItem<Values>, index: number): string {
  if (item.key != null) return String(item.key);
  if (item.name != null) {
    return Array.isArray(item.name) ? item.name.map(String).join('.') : String(item.name);
  }
  return `search-item-${index}`;
}

function resolveVerticalGutter(gutter: RowProps['gutter']): number | undefined {
  if (!Array.isArray(gutter)) return undefined;

  const verticalGutter = gutter[1];
  return typeof verticalGutter === 'number' && verticalGutter > 0 ? verticalGutter : undefined;
}

interface VisibilityState {
  hiddenKeySet: Set<string>;
  collapsible: boolean;
}

/**
 * 收起时首行展示 `colsPerRow` 个字段；`alwaysShow` 项始终可见。
 */
function getVisibilityState<Values>(items: AIISearchItem<Values>[], collapsed: boolean, colsPerRow: number): VisibilityState {
  const entries = items.map((item, index) => ({ item, key: resolveItemKey(item, index) })).filter(({ item }) => !item.hidden);

  const collapsible = entries.length > colsPerRow;

  if (!collapsed || !collapsible) {
    return {
      hiddenKeySet: new Set(),
      collapsible,
    };
  }

  const capacity = colsPerRow;
  const alwaysShowEntries = entries.filter(({ item }) => item.alwaysShow);
  const normalEntries = entries.filter(({ item }) => !item.alwaysShow);
  const remainingSlots = Math.max(0, capacity - alwaysShowEntries.length);
  const visibleNormalKeys = new Set(normalEntries.slice(0, remainingSlots).map(({ key }) => key));
  const alwaysShowKeys = new Set(alwaysShowEntries.map(({ key }) => key));

  const hiddenKeySet = new Set(entries.filter(({ key }) => !alwaysShowKeys.has(key) && !visibleNormalKeys.has(key)).map(({ key }) => key));

  return {
    hiddenKeySet,
    collapsible,
  };
}

interface SearchFieldProps<Values> {
  item: AIISearchItem<Values>;
  defaultColProps: ColProps;
  shrink?: boolean;
}

const shrinkableColStyle: CSSProperties = { flexShrink: 1 };

function SearchFieldInner<Values>({ item, defaultColProps, shrink }: SearchFieldProps<Values>) {
  const { colSpan, hidden: itemHidden, children, formItemProps } = splitSearchItem(item);
  if (itemHidden) return null;

  const colProps = colSpan == null ? defaultColProps : { span: Math.min(GRID_COLUMNS, colSpan) };

  const formItem = (
    <Form.Item
      {...formItemProps}
      className={cn('mb-0!', formItemProps.className)}
    >
      {children}
    </Form.Item>
  );

  return (
    <Col
      {...colProps}
      style={shrink ? shrinkableColStyle : undefined}
    >
      {formItem}
    </Col>
  );
}

const SearchField = memo(SearchFieldInner) as typeof SearchFieldInner;

function AIISearchInner<Values extends Record<string, unknown> = Record<string, unknown>>({
  items,
  onSearch,
  onReset,
  collapsed: collapsedProp,
  defaultCollapsed = DEFAULT_COLLAPSED,
  onCollapse,
  cols,
  maxCols = DEFAULT_MAX_COLS,
  gutter = DEFAULT_GUTTER,
  layout = 'vertical',
  colon = false,
  showActions = true,
  searchText,
  resetText,
  expandText,
  collapseText,
  loading,
  actions,
  card = true,
  wrapperClassName,
  fieldsClassName,
  actionsClassName,
  className,
  form: formProp,
  onFinish,
  ...rest
}: AIISearchProps<Values>) {
  const [internalForm] = Form.useForm<Values>();
  const form = (formProp ?? internalForm) as FormInstance<Values>;
  const screens = Grid.useBreakpoint();

  const isCollapseControlled = collapsedProp !== undefined;
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
  const collapsed = isCollapseControlled ? Boolean(collapsedProp) : uncontrolledCollapsed;

  const responsiveCols = useMemo(() => resolveResponsiveCols(cols, maxCols), [cols, maxCols]);
  const defaultColProps = useMemo<ColProps>(() => getResponsiveColProps(responsiveCols), [responsiveCols]);
  const colsPerRow = useMemo(() => getActiveResponsiveColsPerRow(responsiveCols, screens, responsiveCols.xl), [responsiveCols, screens]);

  const { hiddenKeySet: collapsedHiddenKeySet, collapsible } = useMemo(
    () => getVisibilityState(items, true, colsPerRow),
    [colsPerRow, items],
  );

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (!isCollapseControlled) setUncontrolledCollapsed(next);
      onCollapse?.(next);
    },
    [isCollapseControlled, onCollapse],
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const submit = useCallback(() => {
    void form.submit();
  }, [form]);

  const reset = useCallback(() => {
    form.resetFields();
    onReset?.();
  }, [form, onReset]);

  const handleFinish = useCallback(
    (values: Values) => {
      void onSearch?.(values);
      onFinish?.(values);
    },
    [onFinish, onSearch],
  );

  const actionCtx = useMemo(
    () => ({
      collapsed,
      collapsible,
      loading,
      submit,
      reset,
      toggleCollapse,
    }),
    [collapsed, collapsible, loading, reset, submit, toggleCollapse],
  );

  const actionNode = useMemo(() => {
    if (!showActions) return null;
    if (typeof actions === 'function') {
      const custom = actions(actionCtx);
      if (custom === false) return null;
      return custom;
    }
    if (actions != null) return actions;
    return (
      <SearchActions
        ctx={actionCtx}
        searchText={searchText}
        resetText={resetText}
        expandText={expandText}
        collapseText={collapseText}
        className={actionsClassName}
      />
    );
  }, [actionCtx, actions, actionsClassName, collapseText, expandText, resetText, searchText, showActions]);
  const hasInlineActions = !collapsible && Boolean(actionNode);

  const { visibleFieldNodes, collapsibleFieldNodes } = useMemo(() => {
    const visible: ReactElement[] = [];
    const collapsibleFields: ReactElement[] = [];

    items.forEach((item, index) => {
      if (item.hidden) return;

      const key = resolveItemKey(item, index);
      const node = (
        <SearchField
          key={key}
          item={item}
          defaultColProps={defaultColProps}
          shrink={hasInlineActions}
        />
      );

      if (collapsedHiddenKeySet.has(key)) {
        collapsibleFields.push(node);
      } else {
        visible.push(node);
      }
    });

    return {
      visibleFieldNodes: visible,
      collapsibleFieldNodes: collapsibleFields,
    };
  }, [collapsedHiddenKeySet, defaultColProps, hasInlineActions, items]);

  const containerClassName = cn('w-full', fieldsClassName);
  const shouldAnimateFields = motionConfig.shouldAnimate();
  const collapsibleRowStyle = useMemo<CSSProperties | undefined>(() => {
    const verticalGutter = resolveVerticalGutter(gutter);
    return verticalGutter ? { paddingTop: verticalGutter } : undefined;
  }, [gutter]);

  const formElement = (
    <Form<Values>
      form={form}
      layout={layout}
      colon={colon}
      className={cn('w-full', className)}
      onFinish={handleFinish}
      {...rest}
    >
      {hasInlineActions ? (
        <Row
          gutter={gutter}
          align='bottom'
          wrap={false}
        >
          {visibleFieldNodes}
          <Col flex='0 0 auto'>{actionNode}</Col>
        </Row>
      ) : (
        <Row gutter={gutter}>{visibleFieldNodes}</Row>
      )}
      {collapsible ? (
        <motion.div
          initial={false}
          animate={collapsed ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
          transition={
            shouldAnimateFields
              ? {
                  duration: motionTokens.duration.normal,
                  ease: motionTokens.easing.smooth,
                }
              : {
                  duration: motionTokens.duration.instant,
                }
          }
          style={{
            overflow: 'hidden',
            pointerEvents: collapsed ? 'none' : 'auto',
          }}
        >
          <Row
            gutter={gutter}
            style={collapsibleRowStyle}
          >
            {collapsibleFieldNodes}
          </Row>
        </motion.div>
      ) : null}
      {collapsible && actionNode ? (
        <Row
          gutter={gutter}
          justify='end'
          className='mt-4'
        >
          <Col flex='0 0 auto'>{actionNode}</Col>
        </Row>
      ) : null}
    </Form>
  );

  const formNode = <div className={containerClassName}>{formElement}</div>;

  if (!card) return formNode;

  return (
    <LayoutWrapper
      layout='size'
      className={cn('px-4! py-4!', wrapperClassName)}
    >
      {formNode}
    </LayoutWrapper>
  );
}

type AIISearchComponentType = <Values extends Record<string, unknown> = Record<string, unknown>>(
  props: AIISearchProps<Values>,
) => ReactElement;

export const AIISearch = memo(AIISearchInner) as unknown as AIISearchComponentType;

export default AIISearch;
