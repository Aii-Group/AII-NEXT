<div align="center">
  <img src="../src/assets/asiainfo-logo.png" alt="AsiaInfo logo" width="72" />

# Access

按钮级权限：根据宿主下发的 `permissionsButton`（匹配 `menuCode`）控制按钮与操作的显隐。

</div>

权限数据来自微前端宿主 `MicroAppGlobalData.permissionsButton`，经 `useMicroAppData` 写入 `useUserStore.user.permissionsButton`。独立开发且未下发权限数组时，**ACL 不启用，默认全部放行**。

## 特性

- `Access` 组件按权限码包裹 UI（对齐 Ant Design Pro 的 `accessible` 用法）
- `useAccess` / `hasPermission` 供命令式判断与复杂条件组合
- `AIITable` 的 `toolbar` / `rowActions` / `batchActions` 支持 `permission` 字段，无权限自动隐藏
- 宿主局部更新未携带 `permissionsButton` 时保留本地已有权限，避免误清空

## 权限规则

| 场景                                  | 行为                                   |
| ------------------------------------- | -------------------------------------- |
| `permissionsButton` 为 `undefined`    | ACL 关闭，全部放行                     |
| `permissionsButton` 为数组（含 `[]`） | ACL 开启，仅 `menuCode` 命中的码可通过 |
| 未配置 `code` / `permission`          | 视为无权限约束，放行                   |

匹配字段为 `PermissionsButton.menuCode`。

## 快速开始

### Access 组件

```tsx
import { Button } from 'antd';
import { Access } from '@/components/Access';

export function UserToolbar() {
  return (
    <Access code='user:create'>
      <Button type='primary'>新建</Button>
    </Access>
  );
}
```

多权限码：

```tsx
<Access
  code={['user:edit', 'user:admin']}
  mode='any'
>
  <Button>编辑</Button>
</Access>
```

与业务条件组合（`accessible` 优先于 `code`）：

```tsx
import { useAccess } from '@/hooks/use-access';

function EditButton({ readonly }: { readonly: boolean }) {
  const access = useAccess();

  return (
    <Access accessible={access.can('user:edit') && !readonly}>
      <Button>编辑</Button>
    </Access>
  );
}
```

无权限时展示占位：

```tsx
<Access
  code='user:export'
  fallback={<span>无导出权限</span>}
>
  <Button>导出</Button>
</Access>
```

### useAccess / hasPermission

```tsx
import { useAccess } from '@/hooks/use-access';
import { hasPermission } from '@/utils/permission';

function Page() {
  const { can, canAny, aclEnabled } = useAccess();

  if (can('user:delete')) {
    // ...
  }

  // 非 React 环境（拦截器、工具函数）可读 store
  if (hasPermission('user:export')) {
    // ...
  }

  return null;
}
```

### AIITable 操作权限

```tsx
<AIITable
  toolbar={[{ key: 'create', label: '新建', permission: 'user:create', onClick: () => {} }]}
  rowActions={[
    { key: 'edit', label: '编辑', permission: 'user:edit', onClick: () => {} },
    { key: 'delete', label: '删除', permission: 'user:delete', danger: true, onClick: () => {} },
  ]}
  batchActions={[{ key: 'batch-delete', label: '批量删除', permission: 'user:delete', onClick: () => {} }]}
/>
```

## 本地调试

独立模式下可手动写入权限列表以验证显隐：

```ts
useUserStore.getState().updateUser({
  permissionsButton: [{ menuCode: 'user:create' }, { menuCode: 'user:edit' }],
});
```

清空 ACL（恢复全部放行）：

```ts
useUserStore.getState().updateUser({ permissionsButton: undefined });
```

## API

### AccessProps

| 属性         | 说明                                   |
| ------------ | -------------------------------------- |
| `accessible` | 显式布尔；传入时优先于 `code`          |
| `code`       | 权限码或码数组，对应 `menuCode`        |
| `mode`       | `code` 为数组时：`any` / `all`（默认） |
| `fallback`   | 无权限时渲染内容，默认 `null`          |

### useAccess()

| 字段               | 说明           |
| ------------------ | -------------- |
| `permissions`      | 当前权限列表   |
| `aclEnabled`       | 是否已启用 ACL |
| `can(code, mode?)` | 校验权限       |
| `canAny(codes)`    | 命中任一       |
| `canAll(codes)`    | 需全部具备     |

## 开发检查

```bash
pnpm typecheck
pnpm exec oxlint --deny-warnings src/components/Access
pnpm exec oxfmt --check src/components/Access readme/Access.md
```
