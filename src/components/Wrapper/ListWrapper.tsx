import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSafeMotion } from '@/hooks/use-safe-motion';
import { motionConfig } from '@/lib/motion-config';
import { motionTokens, springs } from '@/lib/motion-tokens';
import { cn } from '@/utils/classnames';

const STAGGER_INTERVAL = 0.08;

const listContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_INTERVAL,
      delayChildren: 0.1,
    },
  },
};

export interface ListWrapperProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey: (item: T, index: number) => string;
  /** Promise 滚动加载回调 */
  onLoadMore: () => Promise<void>;
  hasMore?: boolean;
  /** 首次加载 */
  loading?: boolean;
  className?: string;
  listClassName?: string;
  empty?: ReactNode;
  /** 距底部多少 px 时触发加载 */
  threshold?: number;
  /** 自定义滚动容器，默认使用组件自身 */
  scrollRootRef?: RefObject<HTMLElement | null>;
}

export function ListWrapper<T>({
  items,
  renderItem,
  getItemKey,
  onLoadMore,
  hasMore = false,
  loading = false,
  className,
  listClassName,
  empty,
  threshold = 120,
  scrollRootRef,
}: ListWrapperProps<T>) {
  const { t } = useTranslation('common');
  const safeMotion = useSafeMotion(motionTokens.distance.sm);
  const shouldAnimate = motionConfig.shouldAnimate();
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  const loadingLockRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);

  loadMoreRef.current = onLoadMore;

  const itemVariants = {
    hidden: safeMotion.initial,
    visible: {
      ...safeMotion.animate,
      transition: springs.gentle,
    },
    exit: safeMotion.exit,
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingLockRef.current || !hasMore || loading || loadingMore) return;

    loadingLockRef.current = true;
    setLoadingMore(true);

    try {
      await loadMoreRef.current();
    } finally {
      loadingLockRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const root = scrollRootRef?.current ?? rootRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void handleLoadMore();
      },
      {
        root,
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, threshold, scrollRootRef, items.length]);

  const listContent = (
    <motion.ul
      variants={shouldAnimate ? listContainerVariants : undefined}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : undefined}
      className={cn('space-y-2', listClassName)}
    >
      <AnimatePresence mode='popLayout'>
        {items.map((item, index) => (
          <motion.li
            key={getItemKey(item, index)}
            variants={shouldAnimate ? itemVariants : undefined}
            initial={shouldAnimate ? 'hidden' : false}
            animate={shouldAnimate ? 'visible' : undefined}
            exit={shouldAnimate ? 'exit' : undefined}
            transition={springs.gentle}
            layout={shouldAnimate ? 'position' : false}
          >
            {renderItem(item, index)}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );

  return (
    <div
      ref={rootRef}
      aria-busy={loading}
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-card p-4 text-card-foreground shadow-sm md:p-6 dark:border',
        loading && 'min-h-24',
        className,
      )}
    >
      {items.length === 0 && !loading ? (
        (empty ?? <div className='flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground'>{t('General.Empty')}</div>)
      ) : items.length > 0 ? (
        <div className={cn(loading && 'pointer-events-none opacity-60 select-none')}>{listContent}</div>
      ) : null}

      <AnimatePresence>
        {loading ? (
          <motion.div
            key='list-loading'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
            className='absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-card/50 backdrop-blur-[1px]'
          >
            <Spin aria-label={t('General.Loading')} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!loading && hasMore ? (
        <div
          ref={sentinelRef}
          className='flex min-h-12 items-center justify-center py-4'
          aria-live='polite'
        >
          {loadingMore ? (
            <Spin
              size='small'
              aria-label={t('General.Loading_More')}
            />
          ) : (
            <span className='text-sm text-muted-foreground'>{t('General.Load_More')}</span>
          )}
        </div>
      ) : !loading && items.length > 0 ? (
        <p className='py-4 text-center text-sm text-muted-foreground'>{t('General.No_More')}</p>
      ) : null}
    </div>
  );
}
