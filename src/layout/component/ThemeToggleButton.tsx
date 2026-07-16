import { Moon, Sun } from '@icon-park/react';
import type { MouseEvent } from 'react';
import { Theme } from '@/constants/theme';
import { useThemeMode } from '@/layout/utils/theme';
import { useTranslation } from 'react-i18next';
import { HeaderIconButton } from './HeaderIconButton';

export function ThemeToggleButton() {
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useThemeMode();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleTheme({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <HeaderIconButton
      label={t('Header.Theme')}
      icon={resolvedTheme === Theme.Dark ? <Moon /> : <Sun />}
      onClick={handleClick}
    />
  );
}
