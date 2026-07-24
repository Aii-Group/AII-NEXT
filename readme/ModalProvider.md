<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# ModalProvider

面向表单提交、数据编辑等业务场景的受控弹窗，统一管理打开、关闭、配置更新和提交加载状态。

</div>

`ModalProvider` 基于 Ant Design `Modal` 封装。业务组件通过 `useModal` 打开包含 React 内容的弹窗，无需在页面内重复维护 `open` 和 `confirmLoading` 状态。

## 特性

- 通过 `open`、`close` 和 `update` 命令式管理业务弹窗
- `onOk` 返回 Promise 时自动显示提交 loading
- 异步提交成功后自动关闭，失败时保留弹窗并恢复提交按钮
- 提供 `setLoading`，支持由弹窗内容组件控制提交状态
- loading 期间阻止重复提交
- 打开、关闭或替换弹窗时自动复位内部 loading
- 默认启用 `destroyOnHidden`，关闭后卸载弹窗内容
- 保留 Ant Design `ModalProps` 的标题、按钮、尺寸和生命周期配置

## 快速开始

`ModalProvider` 已在应用入口完成挂载，路由组件及其子组件可以直接使用 `useModal`。

```tsx
import { Button } from 'antd';
import { useModal } from '@/hooks/use-modal';

export function DetailButton() {
  const modal = useModal();

  return (
    <Button
      onClick={() => {
        modal.open({
          title: '用户详情',
          children: <UserDetail />,
          footer: null,
          width: 720,
        });
      }}
    >
      查看详情
    </Button>
  );
}
```

> [!IMPORTANT]
> `useModal` 只能在 `ModalProvider` 的子组件中调用。在 Provider 外调用会直接抛出错误，避免弹窗请求静默失效。

## 异步表单提交

推荐从 `onOk` 返回完整的校验和提交 Promise。Provider 会自动设置 `confirmLoading`，Promise resolve 后关闭弹窗，Promise reject 时保持弹窗打开。

```tsx
import { Button, Form, Input } from 'antd';
import { useModal } from '@/hooks/use-modal';

interface UserFormValues {
  name: string;
  email: string;
}

export function CreateUserButton() {
  const modal = useModal();
  const [form] = Form.useForm<UserFormValues>();

  const openCreateModal = () => {
    form.resetFields();

    modal.open({
      title: '新建用户',
      okText: '提交',
      children: (
        <Form
          form={form}
          layout='vertical'
          preserve={false}
        >
          <Form.Item
            name='name'
            label='用户名'
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name='email'
            label='邮箱'
            rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const values = await form.validateFields();
        await userApi.create(values);
      },
    });
  };

  return <Button onClick={openCreateModal}>新建用户</Button>;
}
```

> [!NOTE]
> `destroyOnHidden` 会卸载弹窗内容，但外部创建的 Ant Design Form 实例仍可能保留字段值。编辑和新建共用表单时，应在打开前调用 `resetFields()`，或为 `Form` 设置 `preserve={false}`。

## 由表单内部提交

`form.submit()` 本身不返回提交 Promise，因此无法触发自动 loading。此时在 `Form.onFinish` 中使用 `setLoading`，并在提交成功后主动关闭弹窗。

```tsx
export function CreateUserWithFormSubmitButton() {
  const modal = useModal();
  const [form] = Form.useForm<UserFormValues>();

  const handleFinish = async (values: UserFormValues) => {
    modal.setLoading(true);

    try {
      await userApi.create(values);
      modal.close();
    } finally {
      modal.setLoading(false);
    }
  };

  const openCreateModal = () => {
    form.resetFields();

    modal.open({
      title: '新建用户',
      children: (
        <Form
          form={form}
          layout='vertical'
          onFinish={handleFinish}
        >
          {/* 表单字段 */}
        </Form>
      ),
      onOk: () => form.submit(),
    });
  };

  return <Button onClick={openCreateModal}>新建用户</Button>;
}
```

无论采用哪种方式，都应确保失败分支恢复 loading，并由业务层展示具体错误。

## 更新弹窗

`update` 合并当前配置，适合更新标题、按钮文案、宽度或外部受控的 `confirmLoading`。

```tsx
modal.update({
  title: '编辑用户',
  okText: '保存',
  width: 640,
});
```

提交状态优先使用语义更明确的 `setLoading`：

```tsx
modal.setLoading(true);
modal.setLoading(false);
```

## API

### `useModal()`

返回 `ModalAPI`：

| 方法         | 类型                                     | 说明                                     |
| ------------ | ---------------------------------------- | ---------------------------------------- |
| `open`       | `(config: ModalConfig) => void`          | 打开弹窗并替换当前配置，同时复位 loading |
| `close`      | `() => void`                             | 关闭弹窗并复位 loading                   |
| `update`     | `(config: Partial<ModalConfig>) => void` | 合并更新当前弹窗配置                     |
| `setLoading` | `(loading: boolean) => void`             | 设置确认按钮的提交 loading               |

### `ModalConfig`

`ModalConfig` 继承 Ant Design `ModalProps`，但不接受 `open`，弹窗显隐由 Provider 管理。`onOk` 扩展为：

```ts
(event: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>
```

| 配置              | 默认值  | 说明                                                      |
| ----------------- | ------- | --------------------------------------------------------- |
| `destroyOnHidden` | `true`  | 弹窗关闭后卸载内容，可通过配置覆盖                        |
| `confirmLoading`  | `false` | 外部受控 loading，与 Provider 内部 loading 按逻辑或合并   |
| `onCancel`        | -       | 先执行业务回调，然后关闭弹窗                              |
| `onOk`            | -       | 同步返回时由业务控制关闭；返回 Promise 时自动管理 loading |

> [!WARNING]
> 当前 Provider 管理一个业务弹窗实例。再次调用 `open` 会替换现有弹窗，不适合同时展示多个相互独立的业务弹窗。

## 与 `$modal` 的区别

| 场景                       | 推荐方式        |
| -------------------------- | --------------- |
| 成功、警告、错误等结果提示 | `window.$modal` |
| 简单确认操作               | `window.$modal` |
| 表单新建、编辑和异步提交   | `useModal`      |
| 包含业务组件和局部状态     | `useModal`      |

`window.$modal` 来自 Ant Design `App.useApp()`，适合 `success`、`warning`、`error` 和 `confirm` 等命令式反馈。`useModal` 渲染受控的 React 内容，适合需要表单实例、业务状态和异步提交生命周期的弹窗。

## Provider 接入

新增独立入口时，应将 `ModalProvider` 放在 Ant Design 上下文内部，并与 `DrawerProvider` 按基座顺序装配：

```tsx
<AntdProvider>
  <AntdAppProvider>
    <ModalProvider>
      <DrawerProvider>{children}</DrawerProvider>
    </ModalProvider>
  </AntdAppProvider>
</AntdProvider>
```

侧滑详情请使用 [`DrawerProvider`](./DrawerProvider.md)（`window.$drawer`）；表单提交与确认类交互继续使用本 Provider / `window.$modal`。

## 模块结构

| 文件                                                                    | 职责                         |
| ----------------------------------------------------------------------- | ---------------------------- |
| [`src/providers/ModalProvider.tsx`](../src/providers/ModalProvider.tsx) | 弹窗渲染、状态和提交生命周期 |
| [`src/hooks/use-modal.ts`](../src/hooks/use-modal.ts)                   | 获取业务弹窗 API             |
| [`src/contexts/modal-context.ts`](../src/contexts/modal-context.ts)     | React Context                |
| [`src/types/modal.ts`](../src/types/modal.ts)                           | 配置与 API 类型              |

## 相关文档

- [`DrawerProvider`](./DrawerProvider.md)：命令式业务抽屉
- [列表页开发规范](../spec/spec-process-crud-list-page.md)：写操作弹窗约定

## 开发检查

```bash
pnpm typecheck
pnpm exec oxlint --deny-warnings src/providers/ModalProvider.tsx src/hooks/use-modal.ts src/contexts/modal-context.ts src/types/modal.ts
pnpm exec oxfmt --check readme/ModalProvider.md
```
