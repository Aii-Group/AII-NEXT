import { isValidElement, memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { motionConfig } from '@/lib/motion-config';
import { motionTokens, springs } from '@/lib/motion-tokens';
import { cn } from '@/utils/classnames';
import { AIITabPanel } from './AIITabPanel';
import type { AIITabBarExtraContent, AIITabItem, AIITabProps, AIITabSize } from './types';

export type { AIITabBarExtraContent, AIITabItem, AIITabProps, AIITabSize } from './types';

const TAB_SIZE_CLASS = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-base',
} as const;

interface TabIndicatorState {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface TabButtonProps {
  item: AIITabItem;
  active: boolean;
  tabId: string;
  panelId: string;
  size: AIITabSize;
  shouldAnimate: boolean;
  onSelect: (key: string) => void;
  setTabRef: (key: string, node: HTMLButtonElement | null) => void;
}

const TabButton = memo(function TabButton({ item, active, tabId, panelId, size, shouldAnimate, onSelect, setTabRef }: TabButtonProps) {
  const className = cn(
    'relative z-10 inline-flex items-center gap-1.5 rounded-md font-medium',
    'text-muted-foreground hover:text-foreground',
    'disabled:pointer-events-none disabled:opacity-50',
    TAB_SIZE_CLASS[size],
    active && 'text-primary-text',
  );

  const handleClick = useCallback(() => onSelect(item.key), [item.key, onSelect]);
  const handleRef = useCallback((node: HTMLButtonElement | null) => setTabRef(item.key, node), [item.key, setTabRef]);

  if (!shouldAnimate) {
    return (
      <button
        ref={handleRef}
        id={tabId}
        type='button'
        role='tab'
        aria-selected={active}
        aria-controls={panelId}
        disabled={item.disabled}
        tabIndex={active ? 0 : -1}
        className={className}
        onClick={handleClick}
      >
        {item.icon ? <span className='inline-flex shrink-0'>{item.icon}</span> : null}
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <motion.button
      ref={handleRef}
      id={tabId}
      type='button'
      role='tab'
      aria-selected={active}
      aria-controls={panelId}
      disabled={item.disabled}
      tabIndex={active ? 0 : -1}
      className={className}
      onClick={handleClick}
      whileHover={{ scale: motionTokens.scale.pop }}
      whileTap={{ scale: motionTokens.scale.press }}
      transition={springs.snappy}
    >
      {item.icon ? <span className='inline-flex shrink-0'>{item.icon}</span> : null}
      <span>{item.label}</span>
    </motion.button>
  );
});

function isExtraContentObject(content: ReactNode | AIITabBarExtraContent): content is AIITabBarExtraContent {
  if (content == null || typeof content !== 'object' || isValidElement(content)) return false;
  return 'left' in content || 'right' in content;
}

function getInitialActiveKey(items: AIITabItem[], activeKey: string | undefined, defaultActiveKey: string | undefined): string {
  if (activeKey) return activeKey;
  if (defaultActiveKey) return defaultActiveKey;
  return items.find((item) => !item.disabled)?.key ?? items[0]?.key ?? '';
}

export function AIITab({
  items,
  activeKey: activeKeyProp,
  defaultActiveKey,
  onChange,
  size = 'md',
  centered = false,
  destroyOnHidden = false,
  tabBarExtraContent,
  className,
  ...props
}: AIITabProps) {
  const baseId = useId();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const reduceMotion = useReducedMotion();
  const shouldAnimate = motionConfig.shouldAnimate({ essential: true });
  const [indicator, setIndicator] = useState<TabIndicatorState>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const isControlled = activeKeyProp !== undefined;
  const [uncontrolledKey, setUncontrolledKey] = useState(() => getInitialActiveKey(items, activeKeyProp, defaultActiveKey));

  const activeKey = isControlled ? activeKeyProp : uncontrolledKey;

  const updateIndicator = useCallback(() => {
    const activeTab = tabRefs.current.get(activeKey);
    const tabList = tabListRef.current;
    if (!activeTab || !tabList) {
      setIndicator({ left: 0, top: 0, width: 0, height: 0 });
      return;
    }

    const listRect = tabList.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - listRect.left + tabList.scrollLeft,
      top: tabRect.top - listRect.top + tabList.scrollTop,
      width: tabRect.width,
      height: tabRect.height,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, items, size, centered]);

  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(tabList);
    tabRefs.current.forEach((tab) => resizeObserver.observe(tab));

    window.addEventListener('resize', updateIndicator);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [items, updateIndicator]);

  const setActiveKey = useCallback(
    (nextKey: string) => {
      const target = items.find((item) => item.key === nextKey);
      if (!target || target.disabled) return;

      if (!isControlled) setUncontrolledKey(nextKey);
      onChange?.(nextKey);
    },
    [isControlled, items, onChange],
  );

  const setTabRef = useCallback((key: string, node: HTMLButtonElement | null) => {
    if (node) tabRefs.current.set(key, node);
    else tabRefs.current.delete(key);
  }, []);

  const extraContent = useMemo(() => {
    if (!tabBarExtraContent) return { left: null, right: null };
    if (isExtraContentObject(tabBarExtraContent)) {
      return {
        left: tabBarExtraContent.left ?? null,
        right: tabBarExtraContent.right ?? null,
      };
    }
    return { left: null, right: tabBarExtraContent };
  }, [tabBarExtraContent]);

  const tabListClassName = cn('relative flex flex-wrap items-center gap-1', centered && 'justify-center');

  const indicatorTransition = !shouldAnimate || reduceMotion ? { duration: motionTokens.duration.instant } : springs.snappy;

  const panelNodes = useMemo(() => {
    const renderPanel = (item: AIITabItem, active: boolean) => (
      <AIITabPanel
        key={item.key}
        panelId={`${baseId}-panel-${item.key}`}
        tabId={`${baseId}-tab-${item.key}`}
        active={active}
        preserveMount={!destroyOnHidden}
      >
        {item.children}
      </AIITabPanel>
    );

    if (destroyOnHidden) {
      const activeItem = items.find((item) => item.key === activeKey);
      return activeItem ? renderPanel(activeItem, true) : null;
    }

    return items.map((item) => renderPanel(item, item.key === activeKey));
  }, [activeKey, baseId, destroyOnHidden, items]);

  return (
    <div
      className={cn('w-full', className)}
      {...props}
    >
      <div className='flex flex-wrap items-center gap-2'>
        {extraContent.left ? <div className='shrink-0'>{extraContent.left}</div> : null}

        <div
          ref={tabListRef}
          role='tablist'
          aria-orientation='horizontal'
          className={cn(tabListClassName, extraContent.left || extraContent.right ? 'flex-1' : 'w-full')}
        >
          {shouldAnimate ? (
            <motion.span
              aria-hidden
              className='pointer-events-none absolute top-0 left-0 z-0 rounded-md bg-primary-bg'
              style={{
                width: indicator.width,
                height: indicator.height,
              }}
              animate={{
                x: indicator.left,
                y: indicator.top,
                opacity: indicator.width > 0 ? 1 : 0,
              }}
              initial={false}
              transition={indicatorTransition}
            />
          ) : (
            <span
              aria-hidden
              className='pointer-events-none absolute z-0 rounded-md bg-primary-bg'
              style={{
                left: indicator.left,
                top: indicator.top,
                width: indicator.width,
                height: indicator.height,
                opacity: indicator.width > 0 ? 1 : 0,
              }}
            />
          )}

          {items.map((item) => {
            const active = item.key === activeKey;
            return (
              <TabButton
                key={item.key}
                item={item}
                active={active}
                tabId={`${baseId}-tab-${item.key}`}
                panelId={`${baseId}-panel-${item.key}`}
                size={size}
                shouldAnimate={shouldAnimate}
                onSelect={setActiveKey}
                setTabRef={setTabRef}
              />
            );
          })}
        </div>

        {extraContent.right ? <div className='shrink-0'>{extraContent.right}</div> : null}
      </div>

      {destroyOnHidden && shouldAnimate ? <AnimatePresence mode='wait'>{panelNodes}</AnimatePresence> : panelNodes}
    </div>
  );
}

export default AIITab;
