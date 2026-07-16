import { flushSync } from 'react-dom';
import { DEFAULT_THEME, SUPPORTED_THEMES, Theme, ThemeClass, type Theme as ThemeMode } from '@/constants/theme';
import { motionConfig } from '@/lib/motion-config';
import { motionTokens } from '@/lib/motion-tokens';
import { isMicroAppEnvironment } from '@/utils/micro';

type ResolvedTheme = Exclude<ThemeMode, typeof Theme.System>;

const DARK_CLASS = ThemeClass[Theme.Dark];
const THEME_TRANSITION_MS = motionTokens.duration.slow * 1000;

/** 进行中的 View Transition，用于互斥，避免连点导致 Chrome 崩溃 */
let activeTransition: ViewTransition | null = null;
let activeCircleAnimation: Animation | null = null;

function collectThemeTargets(): HTMLElement[] {
  const targets = new Set<HTMLElement>();
  targets.add(document.documentElement);

  const appRoot = document.getElementById('root');
  if (appRoot) {
    targets.add(appRoot);
  }

  if (isMicroAppEnvironment()) {
    const microBody = document.querySelector('micro-app-body');
    if (microBody instanceof HTMLElement) {
      targets.add(microBody);
    }
  }

  return [...targets];
}

function syncDarkClass(target: HTMLElement, shouldBeDark: boolean) {
  const isDark = target.classList.contains(DARK_CLASS);
  if (shouldBeDark === isDark) return;

  if (shouldBeDark) {
    target.classList.add(DARK_CLASS);
    return;
  }

  target.classList.remove(DARK_CLASS);
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return Theme.Light;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.Dark : Theme.Light;
}

export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === Theme.System ? getSystemTheme() : theme;
}

export function resolveHostTheme(theme: unknown): ThemeMode | undefined {
  if (theme === Theme.Light || theme === Theme.Dark) {
    return theme;
  }

  return undefined;
}

export function applyTheme(theme: ThemeMode) {
  const shouldBeDark = resolveTheme(theme) === Theme.Dark;

  for (const target of collectThemeTargets()) {
    syncDarkClass(target, shouldBeDark);
  }
}

export type ThemeTransitionOrigin = {
  x: number;
  y: number;
};

function canUseThemeViewTransition() {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof document.startViewTransition === 'function' &&
    motionConfig.shouldAnimate({ essential: true }) &&
    !isMicroAppEnvironment()
  );
}

function clearThemeTransitionState() {
  activeCircleAnimation?.cancel();
  activeCircleAnimation = null;
  activeTransition = null;
  delete document.documentElement.dataset.themeTransition;
}

function abortActiveThemeTransition() {
  const previous = activeTransition;
  activeCircleAnimation?.cancel();
  activeCircleAnimation = null;
  activeTransition = null;
  delete document.documentElement.dataset.themeTransition;

  if (!previous) return;

  try {
    previous.skipTransition();
  } catch {
    // 已结束或无法跳过
  }
}

function resolveTransitionOrigin(origin?: ThemeTransitionOrigin) {
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  return { x, y, radius };
}

function runCircleReveal(transition: ViewTransition, toDark: boolean, origin?: ThemeTransitionOrigin) {
  if (activeTransition !== transition) return;

  const { x, y, radius } = resolveTransitionOrigin(origin);
  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];

  try {
    activeCircleAnimation = document.documentElement.animate(
      {
        clipPath: toDark ? clipPath : [...clipPath].reverse(),
      },
      {
        duration: THEME_TRANSITION_MS,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
        pseudoElement: toDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
      },
    );
  } catch {
    // 伪元素已不存在（过渡被跳过/中断）
  }
}

/**
 * 用户主动切换主题时使用，圆形裁剪过渡。
 * `onUpdate`（如 Zustand set）必须在此回调内执行，以便 View Transition 能拍到新旧快照。
 */
export function applyThemeWithTransition(theme: ThemeMode, origin?: ThemeTransitionOrigin, onUpdate?: () => void) {
  const commit = () => {
    flushSync(() => {
      applyTheme(theme);
      onUpdate?.();
    });
  };

  if (!canUseThemeViewTransition()) {
    commit();
    return;
  }

  // 上一次过渡未结束：中止旧过渡并瞬时提交，避免叠加 startViewTransition 导致崩溃
  if (activeTransition) {
    abortActiveThemeTransition();
    commit();
    return;
  }

  const toDark = resolveTheme(theme) === Theme.Dark;
  const root = document.documentElement;
  root.dataset.themeTransition = toDark ? 'to-dark' : 'to-light';

  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(commit);
  } catch {
    clearThemeTransitionState();
    commit();
    return;
  }

  activeTransition = transition;

  void transition.ready
    .then(() => {
      runCircleReveal(transition, toDark, origin);
    })
    .catch(() => {
      // ready 被拒绝（跳过/中断）时不启动圆形动画
    });

  void transition.finished.finally(() => {
    if (activeTransition === transition) {
      clearThemeTransitionState();
    }
  });
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && SUPPORTED_THEMES.includes(value as ThemeMode);
}

export function getResolvedTheme(theme: ThemeMode = DEFAULT_THEME): ResolvedTheme {
  return resolveTheme(theme);
}

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const event = new CustomEvent('aii-system-theme-change');
    window.dispatchEvent(event);
  });
}
