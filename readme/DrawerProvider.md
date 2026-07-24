<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# DrawerProvider

面向详情展示、宽表单或辅助面板等业务场景的命令式抽屉，统一管理打开、关闭与配置更新。

</div>

`DrawerProvider` 基于 Ant Design `Drawer` 封装。业务通过全局 `window.$drawer` 打开包含 React 内容的抽屉，无需在页面内维护 `open` 状态。与 [`ModalProvider`](./ModalProvider.md) 分工：表单提交、确认类交互优先 Modal；侧滑详情、宽内容、可调整宽度的面板优先 Drawer。

## 特性

- 通过 `open`、`close`、`update` 命令式管理业务抽屉
- 默认启用 `resizable: true`，可拖拽调整宽度
- 关闭时自动调用配置中的 `onClose`，并同步内部 `open=false`
- 保留 Ant Design `DrawerProps`（标题、尺寸、placement、生命周期等）
- 单实例：新的 `open` 会替换当前配置

## 快速开始

`DrawerProvider` 已在应用入口挂载（位于 `ModalProvider` 之后）。任意业务代码可直接使用 `window.$drawer`：

```tsx
import { Button } from 'antd';

export function DetailButton({ userId }: { userId: string }) {
  return (
    <Button
      onClick={() => {
        window.$drawer.open({
          title: '用户详情',
          width: 480,
          children: <UserDetail id={userId} />,
        });
      }}
    >
      查看详情
    </Button>
  );
}
```

关闭与局部更新：

```tsx
window.$drawer.update({ title: '用户详情（已刷新）' });
window.$drawer.close();
```

> [!NOTE]
> 当前基座**不提供** `useDrawer` Hook。命令式入口为 `window.$drawer`（类型见 `@/types/drawer` 的 `DrawerAPI` / `DrawerConfig`）。需要与 React 生命周期强绑定的场景，可在打开时传入受控内容组件，由内容自行请求数据。

## 与 Modal 的选用

| 场景                                     | 推荐                                      |
| ---------------------------------------- | ----------------------------------------- |
| 新建 / 编辑表单提交、需 `confirmLoading` | [`useModal`](./ModalProvider.md)          |
| 删除等二次确认                           | `window.$modal.confirm`                   |
| 只读详情、较宽辅助信息、可调宽面板       | `window.$drawer`                          |
| 列表页「查看详情」且无提交               | Drawer 或 Modal 均可；Drawer 更适合长内容 |

> [!IMPORTANT]
> 列表页写操作（create/update）MUST 使用 `useModal`，见 [列表页开发规范](../spec/spec-process-crud-list-page.md)。Drawer 适合只读详情或产品明确要求的侧滑表单。

## 默认行为

| 配置        | 默认值           | 说明                                       |
| ----------- | ---------------- | ------------------------------------------ |
| `resizable` | `true`           | 可拖拽调整抽屉宽度；调用方可覆盖为 `false` |
| `open`      | 由 Provider 管理 | 配置类型为 `Omit<DrawerProps, 'open'>`     |

`open(config)` 会将默认配置与入参浅合并；同名字段以入参为准。

## API

```ts
interface DrawerAPI {
  open: (config: DrawerConfig) => void;
  close: () => void;
  update: (config: Partial<DrawerConfig>) => void;
}

type DrawerConfig = Omit<DrawerProps, 'open'>;
```

| 方法              | 说明                                     |
| ----------------- | ---------------------------------------- |
| `open(config)`    | 打开抽屉并应用配置（含默认 `resizable`） |
| `close()`         | 关闭抽屉                                 |
| `update(partial)` | 合并更新当前配置（抽屉保持打开）         |

## 完整示例

```tsx
function openUserDetail(record: { id: string; name: string }) {
  window.$drawer.open({
    title: record.name,
    width: 560,
    destroyOnHidden: true,
    children: <UserDetailPanel id={record.id} />,
    onClose: () => {
      // 可选：清理外部状态
    },
  });
}
```

在 `AIITable.rowActions` 中：

```tsx
{
  key: 'view',
  label: t('common:Actions.View'),
  onClick: (record) => openUserDetail(record),
}
```

## 相关文档

- [`ModalProvider`](./ModalProvider.md)：命令式业务弹窗与异步提交
- [列表页开发规范](../spec/spec-process-crud-list-page.md)：CRUD 与只读详情约定
- [前端基座架构规范](../spec/spec-architecture-aii-next-frontend-base.md)：Provider 装配顺序

## 开发检查

```bash
pnpm typecheck
pnpm exec oxlint --deny-warnings src/providers/DrawerProvider.tsx src/types/drawer.ts
pnpm exec oxfmt --check src/providers/DrawerProvider.tsx src/types/drawer.ts readme/DrawerProvider.md
```
