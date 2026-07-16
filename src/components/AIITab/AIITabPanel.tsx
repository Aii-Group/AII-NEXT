import { memo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSafeMotion } from '@/hooks/use-safe-motion';
import { motionConfig } from '@/lib/motion-config';
import { motionTokens } from '@/lib/motion-tokens';
import { cn } from '@/utils/classnames';

interface AIITabPanelProps {
  panelId: string;
  tabId: string;
  active: boolean;
  preserveMount: boolean;
  children?: ReactNode;
  className?: string;
}

export const AIITabPanel = memo(function AIITabPanel({ panelId, tabId, active, preserveMount, children, className }: AIITabPanelProps) {
  const safeMotion = useSafeMotion(motionTokens.distance.sm);
  const shouldAnimate = motionConfig.shouldAnimate({ essential: true });

  if (preserveMount && !active) {
    return (
      <div
        id={panelId}
        role='tabpanel'
        aria-labelledby={tabId}
        hidden
        tabIndex={-1}
        className={cn('pt-4 outline-none', className)}
      >
        {children}
      </div>
    );
  }

  if (!shouldAnimate) {
    return (
      <div
        id={panelId}
        role='tabpanel'
        aria-labelledby={tabId}
        tabIndex={0}
        className={cn('pt-4 outline-none', className)}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={panelId}
      role='tabpanel'
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn('pt-4 outline-none', className)}
      initial={safeMotion.initial}
      animate={safeMotion.animate}
      exit={safeMotion.exit}
      transition={{
        duration: safeMotion.reduce ? motionTokens.duration.instant : motionTokens.duration.fast,
        ease: motionTokens.easing.smooth,
      }}
    >
      {children}
    </motion.div>
  );
});
