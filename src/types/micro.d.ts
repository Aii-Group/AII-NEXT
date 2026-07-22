/** micro-app 子应用数据通信 */
export type MicroAppData = Record<string, unknown>;

export type MicroAppDataListener<T extends MicroAppData = MicroAppData> = (data: T) => void;

/** 子应用 window.microApp API，见 https://jd-opensource.github.io/micro-app/docs.html#/zh-cn/api/child-app */
export interface MicroAppChildAPI {
  getData: () => MicroAppData | null;
  addDataListener: (dataListener: MicroAppDataListener, autoTrigger?: boolean) => void;
  removeDataListener: (dataListener: MicroAppDataListener) => void;
  clearDataListener: () => void;
  dispatch: (data: MicroAppData) => void;

  getGlobalData: () => MicroAppData | null;
  addGlobalDataListener: (dataListener: MicroAppDataListener, autoTrigger?: boolean) => void;
  removeGlobalDataListener: (dataListener: MicroAppDataListener) => void;
  clearGlobalDataListener: () => void;
  setGlobalData: (data: MicroAppData) => void;

  pureCreateElement: <K extends keyof HTMLElementTagNameMap>(tagName: K) => HTMLElementTagNameMap[K];
  removeDomScope: (force?: boolean) => void;
}

declare global {
  interface Window {
    /** 子应用通信 API，仅在微前端环境中可用 */
    microApp?: MicroAppChildAPI;

    /** 是否在 micro-app 微前端环境中运行 */
    __MICRO_APP_ENVIRONMENT__?: boolean;

    /** 当前子应用 name，对应 `<micro-app name>` */
    __MICRO_APP_NAME__?: string;

    /** 子应用静态资源前缀 */
    __MICRO_APP_PUBLIC_PATH__?: string;

    /** 子应用基础路由 */
    __MICRO_APP_BASE_ROUTE__?: string;

    /** 真实 window（主应用） */
    rawWindow?: Window;

    /** 真实 document（主应用） */
    rawDocument?: Document;

    /** micro-app 子应用挂载生命周期 */
    mount?: () => void;

    /** micro-app 子应用卸载生命周期 */
    unmount?: () => void;
  }
}
