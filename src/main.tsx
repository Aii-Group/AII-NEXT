import { createRoot, type Root } from 'react-dom/client';
import { syncMicroAppPreferenceFromHost } from '@/hooks/use-micro-app-data';
import { initTheme } from '@/layout/utils/theme';
import { usePreferenceStore } from '@/store/preference/store';
import { isMicroAppEnvironment } from '@/utils/micro';
import { setDayjsLocale } from '@/utils/dayjs';
import App from '@/App';
import i18n from '@/i18n';
import '@/utils/dayjs';
import '@/index.css';

initTheme(usePreferenceStore.getState().theme);
setDayjsLocale(usePreferenceStore.getState().locale);
void i18n.changeLanguage(usePreferenceStore.getState().locale);
document.documentElement.lang = usePreferenceStore.getState().locale;

let root: Root | null = null;

function renderApp() {
  const container = document.getElementById('root');

  if (!container) {
    throw new Error('[micro] 未找到 #root 挂载节点');
  }

  syncMicroAppPreferenceFromHost();
  initTheme(usePreferenceStore.getState().theme);

  if (!root) {
    root = createRoot(container);
  }

  root.render(<App />);
}

function unmountApp() {
  root?.unmount();
  root = null;
}

// micro-app 子应用生命周期
// @see https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/framework/react
window.mount = renderApp;
window.unmount = unmountApp;

if (!isMicroAppEnvironment()) {
  renderApp();
}
