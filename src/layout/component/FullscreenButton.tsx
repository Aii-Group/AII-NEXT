import { useEffect, useState } from 'react';
import { FullScreen, OffScreen } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { HeaderIconButton } from './HeaderIconButton';

export function FullscreenButton() {
  const { t } = useTranslation('common');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // 浏览器可能拒绝全屏请求
    }
  };

  return (
    <HeaderIconButton
      label={isFullscreen ? t('Header.Exit_Fullscreen') : t('Header.Fullscreen')}
      icon={isFullscreen ? <OffScreen /> : <FullScreen />}
      onClick={() => void handleToggle()}
    />
  );
}
