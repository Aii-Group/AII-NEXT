import type { ReactNode } from 'react';
import { DEFAULT_ICON_CONFIGS, IconProvider } from '@icon-park/react';
import { BrandSeed } from '@/constants';

const iconParkConfig = {
  ...DEFAULT_ICON_CONFIGS,
  size: 18,
  theme: 'outline' as const,
  colors: {
    ...DEFAULT_ICON_CONFIGS.colors,
    outline: {
      fill: 'currentColor',
      background: 'transparent',
    },
    filled: {
      fill: 'currentColor',
      background: 'transparent',
    },
    twoTone: {
      fill: 'currentColor',
      twoTone: BrandSeed.Primary,
    },
    multiColor: {
      ...DEFAULT_ICON_CONFIGS.colors.multiColor,
      outFillColor: BrandSeed.Primary,
      innerFillColor: BrandSeed.Primary,
    },
  },
};

interface IconParkProviderProps {
  children: ReactNode;
}

export function IconParkProvider({ children }: IconParkProviderProps) {
  return <IconProvider value={iconParkConfig}>{children}</IconProvider>;
}
