import type { BrandColors } from '@/constants/brand';
import type { Locale } from '@/constants/locale';
import type { Theme } from '@/constants/theme';

export interface PreferenceState {
  locale: Locale;
  brandColor: BrandColors;
  theme: Theme;
}
