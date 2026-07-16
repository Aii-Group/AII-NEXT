import { motionTokens } from '@/lib/motion-tokens';

type NavigatorWithMemory = Navigator & {
  deviceMemory?: number;
};

export const motionConfig = {
  isLowEnd() {
    if (typeof navigator === 'undefined') return false;

    const nav = navigator as NavigatorWithMemory;

    return (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (nav.deviceMemory === undefined && nav.hardwareConcurrency <= 4);
  },

  prefersReduced() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  shouldAnimate({ essential = false } = {}) {
    if (this.prefersReduced()) return false;
    if (!essential && this.isLowEnd()) return false;
    return true;
  },

  duration() {
    return this.isLowEnd() || this.prefersReduced() ? motionTokens.duration.instant : motionTokens.duration.normal;
  },
};
