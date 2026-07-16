import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import { BrandSeed } from '../constants/brand.ts';

const { defaultAlgorithm, darkAlgorithm } = theme;

export const AntdSeedToken = {
  colorPrimary: BrandSeed.Primary,
  colorSuccess: BrandSeed.Success,
  colorError: BrandSeed.Error,
  colorWarning: BrandSeed.Warning,
  colorInfo: BrandSeed.Primary,
  colorLink: BrandSeed.Primary,
  borderRadius: 8,
} as const;

export const antdThemeConfig = {
  token: AntdSeedToken,
  components: {
    Menu: {
      iconSize: 16,
      iconMarginInlineEnd: 12,
    },
  },
} satisfies ThemeConfig;

export const antdLightTokens = theme.getDesignToken({
  ...antdThemeConfig,
  algorithm: defaultAlgorithm,
});

export const antdDarkTokens = theme.getDesignToken({
  ...antdThemeConfig,
  algorithm: darkAlgorithm,
});
