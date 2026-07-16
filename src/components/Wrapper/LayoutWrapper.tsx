import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from '@tanstack/react-router';
import { useSafeMotion } from '@/hooks/use-safe-motion';
import { motionConfig } from '@/lib/motion-config';
import { motionTokens } from '@/lib/motion-tokens';
import { cn } from '@/utils/classnames';

export interface LayoutWrapperProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  layout?: boolean | 'position' | 'size' | 'preserve-aspect';
}

const LAYOUT_WRAPPER_CLASS = 'min-h-0 rounded-2xl bg-card p-4 text-card-foreground shadow-sm md:p-6 dark:border';

export function LayoutWrapper({ children, className, animate: enableTransition = true, layout = false }: LayoutWrapperProps) {
  const { pathname } = useLocation();
  const safeMotion = useSafeMotion(motionTokens.distance.sm);
  const shouldAnimate = enableTransition && motionConfig.shouldAnimate();

  if (!shouldAnimate) {
    return <div className={cn(LAYOUT_WRAPPER_CLASS, className)}>{children}</div>;
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={pathname}
        layout={layout}
        initial={{ opacity: 1, y: safeMotion.reduce ? 0 : motionTokens.distance.sm }}
        animate={safeMotion.animate}
        exit={safeMotion.exit}
        transition={{
          duration: safeMotion.reduce ? motionTokens.duration.instant : motionTokens.duration.normal,
          ease: motionTokens.easing.smooth,
        }}
        className={cn(LAYOUT_WRAPPER_CLASS, className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
