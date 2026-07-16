import type { MicroAppChildAPI, MicroAppData, MicroAppDataListener } from '@/types/micro';

export interface MicroAppErrorMessageParams {
  status?: number;
  errorCode?: unknown;
  httpMethod?: string;
  rawUrl?: string;
  placeholderMapping?: Record<string, unknown>;
}

export interface MicroAppErrorMessage extends MicroAppErrorMessageParams {
  errorMsg?: string;
}

// ---------------------------------------------------------------------------
// 环境变量
// https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/env
// ---------------------------------------------------------------------------

/** 是否在 micro-app 微前端环境中运行 */
export function isMicroAppEnvironment(): boolean {
  return Boolean(window.__MICRO_APP_ENVIRONMENT__);
}

/** 获取子应用 name（`<micro-app name>` 的值） */
export function getMicroAppName(): string | undefined {
  return window.__MICRO_APP_NAME__;
}

/** 获取子应用静态资源前缀 */
export function getMicroAppPublicPath(): string | undefined {
  return window.__MICRO_APP_PUBLIC_PATH__;
}

/** 获取子应用基础路由 */
export function getMicroAppBaseRoute(): string | undefined {
  return window.__MICRO_APP_BASE_ROUTE__;
}

/** 获取真实 window（主应用） */
export function getRawWindow(): Window {
  return window.rawWindow ?? window;
}

/** 获取真实 document（主应用） */
export function getRawDocument(): Document {
  return window.rawDocument ?? document;
}

// ---------------------------------------------------------------------------
// 子应用 API
// https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/api/child-app
// ---------------------------------------------------------------------------

function getMicroApp(): MicroAppChildAPI | null {
  return window.microApp ?? null;
}

function assertMicroApp(): MicroAppChildAPI {
  const microApp = getMicroApp();

  if (!microApp) {
    throw new Error('[micro] 当前不在 micro-app 子应用环境中');
  }

  return microApp;
}

/** 获取主应用下发的 data */
export function getMicroData<T extends MicroAppData = MicroAppData>(): T | null {
  return (getMicroApp()?.getData() as T | null) ?? null;
}

/** 监听主应用下发的 data */
export function addMicroDataListener<T extends MicroAppData = MicroAppData>(listener: MicroAppDataListener<T>, autoTrigger = false): void {
  assertMicroApp().addDataListener(listener as MicroAppDataListener, autoTrigger);
}

/** 解绑 data 监听 */
export function removeMicroDataListener<T extends MicroAppData = MicroAppData>(listener: MicroAppDataListener<T>): void {
  getMicroApp()?.removeDataListener(listener as MicroAppDataListener);
}

/** 清空当前子应用的所有 data 监听（全局监听除外） */
export function clearMicroDataListeners(): void {
  getMicroApp()?.clearDataListener();
}

/** 向主应用发送 data（仅接受对象） */
export function dispatchMicroData<T extends MicroAppData = MicroAppData>(data: T): void {
  assertMicroApp().dispatch(data);
}

/** 将子应用请求错误交给宿主统一展示 */
export function dispatchMicroErrorMessage({ errorMsg, ...params }: MicroAppErrorMessage): boolean {
  if (!isMicroAppEnvironment()) {
    return false;
  }

  const microApp = getMicroApp();
  if (!microApp) {
    return false;
  }

  microApp.dispatch({
    type: 'showErrorMessage',
    params,
    errorMsg,
  });

  return true;
}

/** 获取全局 data */
export function getMicroGlobalData<T extends MicroAppData = MicroAppData>(): T | null {
  return (getMicroApp()?.getGlobalData() as T | null) ?? null;
}

/** 监听全局 data */
export function addMicroGlobalDataListener<T extends MicroAppData = MicroAppData>(
  listener: MicroAppDataListener<T>,
  autoTrigger = false,
): void {
  assertMicroApp().addGlobalDataListener(listener as MicroAppDataListener, autoTrigger);
}

/** 解绑全局 data 监听 */
export function removeMicroGlobalDataListener<T extends MicroAppData = MicroAppData>(listener: MicroAppDataListener<T>): void {
  getMicroApp()?.removeGlobalDataListener(listener as MicroAppDataListener);
}

/** 清空全局 data 监听 */
export function clearMicroGlobalDataListeners(): void {
  getMicroApp()?.clearGlobalDataListener();
}

/** 发送全局 data */
export function setMicroGlobalData<T extends MicroAppData = MicroAppData>(data: T): void {
  assertMicroApp().setGlobalData(data);
}

/** 创建无绑定的纯净元素，可逃离子应用沙箱 */
export function pureCreateElement<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] {
  return assertMicroApp().pureCreateElement(tagName);
}

/**
 * 解除元素绑定。
 * `force=true` 时会在一个微任务周期内阻止再次绑定。
 */
export function removeDomScope(force?: boolean): void {
  assertMicroApp().removeDomScope(force);
}
