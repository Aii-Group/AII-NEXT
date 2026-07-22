---
title: AII-NEXT 国际化文案规范
version: 1.0
date_created: 2026-07-20
last_updated: 2026-07-20
owner: AII-NEXT 维护团队
tags: [process, design, app, i18n, locale]
---

# Introduction

本规范定义 **AII-NEXT** 中用户可见文案的存放位置、 YAML 结构、Key 命名与新增文案决策流程。目标是保证 `zh-CN` / `en-US` 对称、可复用、层级扁平，便于业务开发与 Generative AI 一致地生成与审查文案。

## 1. Purpose & Scope

### 目的

- 约束文案文件与业务大项的对应关系，避免文案散落或重复造句。
- 强制扁平 Key 结构，降低查找成本与拼接错误。
- 规定新增文案时的决策顺序：**先复用 → 再判断公共/独有 → 最后落盘**。

### 范围

本规范适用于：

- `locales/zh-CN/*.yaml` 与 `locales/en-US/*.yaml` 的新增与修改。
- 业务组件、路由页、布局、公共组件中通过 `react-i18next` 引用的文案。
- 列表页、表单、弹窗、菜单、错误提示等用户可见字符串。

本规范**不**覆盖：

- 后端返回的已本地化业务消息（前端仅展示时可原样输出，但不得因此在前端再硬编码同义句）。
- 调试日志、内部错误码、非用户可见的技术字符串。
- 日期/数字格式化（使用 `@/utils/dayjs` 与 Intl，不在本规范展开）。

### 受众

- 前端业务开发工程师
- 代码审查人员
- 使用 Generative AI 辅助生成文案或页面的工具链

### 假设

- 工程通过 `import.meta.glob('locales/*/*.yaml')` 自动加载命名空间；文件名即 i18n **namespace**。
- 默认命名空间为 `common`（见 `src/i18n/index.ts`）。
- 支持语言为 `zh-CN` 与 `en-US`，必须成对维护。

## 2. Definitions

| 术语                      | 定义                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Locale**                | 语言区域，如 `zh-CN`、`en-US`。                                                                      |
| **Namespace（命名空间）** | 对应 `locales/{locale}/{name}.yaml` 的文件名（不含扩展名），如 `common`、`demo`、`menu`。            |
| **大项（Section）**       | 同一命名空间文件内的一级分组 Key，对应同一功能目录/页面族下的一块业务，如 `demo.yaml` 中的 `Users`。 |
| **叶子 Key**              | 大项下直接挂载的文案键，如 `Name_Placeholder`；调用形态为 `t('Users.Name_Placeholder')`。            |
| **公共文案**              | 可跨业务复用的文案，优先放在 `common`（或既有横切命名空间如 `fetch`、`menu`）。                      |
| **独有文案**              | 仅某一业务大项语义成立的文案，放在对应业务命名空间文件的对应大项下。                                 |
| **扁平层级**              | YAML 在命名空间文件内最多两级：`大项 → 叶子 Key`；禁止更深嵌套。                                     |

## 3. Requirements, Constraints & Guidelines

### 3.1 文件与大项归属

- **REQ-001**: 用户可见文案 MUST 写入 `locales/zh-CN/` 与 `locales/en-US/` 下的 YAML；禁止在 JSX/TS 中硬编码面向用户的字符串（调试日志除外）。
- **REQ-002**: 同一功能目录 / 同一业务大项的相关文案 MUST 放在**同一个**命名空间文件中，用一级大项 Key 分割（例如 `features/demo-users` 与路由 `demo/users` 对应 `demo.yaml` 的 `Users:`）。
- **REQ-003**: 不得为同一大项拆成多个业务 YAML 文件（如同时存在 `demo-users.yaml` 与 `demo-user-form.yaml`），除非该目录已升级为独立产品域并整体迁移命名空间。
- **REQ-004**: 横切能力文案 MUST 使用既有横切命名空间，不得塞进业务文件：
  - 通用操作/字段/空态等 → `common`
  - 菜单 → `menu`
  - 请求/拦截错误 → `fetch`
- **REQ-005**: 新增命名空间文件时，`zh-CN` 与 `en-US` MUST 同时新增同名文件；Key 集合 MUST 对称（允许译文不同，禁止单侧缺 Key）。

### 3.2 层级与 Key 结构（禁止多层）

- **REQ-010**: 命名空间 YAML 内结构 MUST 为至多两级：

  ```yaml
  # ✅ 允许：大项 → 叶子
  Users:
    Name: 姓名
    Name_Placeholder: 请输入姓名
  ```

  ```yaml
  # ❌ 禁止：大项 → 子组 → 叶子（多层）
  Users:
    Form:
      Fields:
        Name: 姓名
  ```

- **REQ-011**: 语义分组通过**叶子 Key 命名前缀/后缀**表达，不得靠再嵌套一层 YAML。例如：`Name` / `Name_Placeholder` / `Name_Required`，而非 `Name.Placeholder`。
- **REQ-012**: 叶子 Key MUST 使用 `Pascal_Snake` 风格（单词首字母大写，下划线连接），与现有 `common.yaml`、`demo.yaml` 一致；禁止 `camelCase`、`kebab-case` 混用。
- **REQ-013**: 调用时 MUST 使用 `大项.叶子Key`；跨命名空间 MUST 使用 `namespace:大项.叶子Key`（例如 `t('common:Actions.Create')`、`t('Users.Create_Title')` 且 `useTranslation('demo')`）。

### 3.3 新增文案决策流程（强制顺序）

生成或补齐文案时，MUST 按以下顺序决策，并在审查中可追溯：

```text
1. 复用已有文案？
   ├─ 是 → 直接 t(既有 key)，不新增
   └─ 否 → 进入 2
2. 该句是否跨业务仍语义成立（公共）？
   ├─ 是 → 提取/新增到 common（或既有横切 NS），再引用
   └─ 否 → 进入 3
3. 落入当前业务命名空间的对应大项下，新增扁平叶子 Key
```

- **REQ-020**: 新增前 MUST 检索 `common` 与当前业务命名空间是否已有同义/近义 Key（含 `Actions`、`General`、`Fields`、`AII_Table`、`AII_Search` 等）。
- **REQ-021**: 以下类型文案 SHOULD 复用 `common`，不得在业务文件重复定义同义句：
  - 通用操作：创建、编辑、删除、提交、取消、确认、查询、重置、刷新等（`common:Actions.*`）
  - 通用状态/空态：成功、失败、暂无数据等（`common:General.*`）
  - 通用字段名：名称、状态、创建时间等，在业务无特殊措辞时（`common:Fields.*`）
  - 表格/搜索组件壳文案（`common:AII_Table.*`、`common:AII_Search.*`）
- **REQ-022**: 仅当措辞依赖具体业务对象或场景时，MUST 作为独有文案落在业务大项下。例如「将删除用户「{{name}}」」不可用通用「删除」代替确认正文。
- **REQ-023**: 若多个业务大项出现**完全相同**的句子，SHOULD 上收至 `common`（或共享业务命名空间的共享大项），避免复制粘贴漂移。
- **REQ-024**: 业务大项内的「成功提示」「确认框标题」等若可抽象为无业务词的通用句（如「创建成功」），优先复用或上收 `common`；含业务名词的（如「新建用户」）保留在业务大项。

### 3.4 插值与句式

- **REQ-030**: 动态部分 MUST 使用 i18n 插值（`{{name}}`、`{{count}}`），禁止字符串拼接翻译结果。
- **REQ-031**: 同一句意的中英文 MUST 保持完整句，不得假设语序可拼接（禁止 `t('A') + name + t('B')` 拼句）。
- **REQ-032**: 确认类危险操作文案 SHOULD 说明对象与不可撤销性（业务独有正文 + `common` 操作按钮文案组合）。

### 3.5 与代码组织的对应

- **REQ-040**: `useTranslation` 的命名空间列表 SHOULD 仅包含本页实际用到的 NS；业务页典型为 `useTranslation(['{biz}', 'common'])`。
- **REQ-041**: 菜单文案 MUST 只写在 `menu.yaml`；`menu.ts` 的 `label` 为 Key，展示时再翻译。
- **REQ-042**: 列表页相关约定见 [列表页开发规范](./spec-process-crud-list-page.md)；其中操作按钮文案优先 `common`，页面/字段/确认正文按本规范决策流程落盘。

### 3.6 约束

- **CON-001**: 禁止三层及以上 YAML 嵌套（自文件根起：大项为第 1 级，叶子为第 2 级，不得再有第 3 级）。
- **CON-002**: 禁止在业务 YAML 中复制一份 `Actions.Create: 创建` 等与 `common` 同义的键。
- **CON-003**: 禁止只改一种语言文件导致 Key 不对称。
- **CON-004**: 禁止用多层路径模拟命名空间（如 Key 写成 `Demo.Users.Form.Name` 却放在错误文件）。

### 3.7 指南

- **GUD-001**: 大项命名与路由/功能名对齐，使用 `PascalCase` 单段名（`Users`、`Orders`），不要用 `users_page`。
- **GUD-002**: 叶子 Key 常用后缀：`_Title`、`_Description`、`_Placeholder`、`_Required`、`_Invalid`、`_Success`、`_Confirm_Title`、`_Confirm_Content`。
- **GUD-003**: 枚举展示值（启用/停用）若全局一致，优先 `common:Actions.Enable` 等；若业务语义特殊再独有。
- **GUD-004**: AI 生成文案时，输出中 SHOULD 简要注明：复用了哪些 Key、为何未进 `common`、新增了哪些独有 Key。

- **PAT-001**: **One Domain One File** — 同一业务大项文案集中在一个 NS 文件，用大项 Key 分割。
- **PAT-002**: **Flat Leaves** — 只用「大项.叶子」，用后缀表达结构。
- **PAT-003**: **Reuse → Common → Local** — 先复用，再公共，最后独有。

## 4. Interfaces & Data Contracts

### 4.1 目录契约

```text
locales/
  zh-CN/
    common.yaml    # 公共文案（默认 NS）
    menu.yaml      # 侧栏菜单
    fetch.yaml     # 请求/错误等横切
    {biz}.yaml     # 业务命名空间（按大项目录新增）
  en-US/
    （与 zh-CN 同名文件一一对应）
```

### 4.2 业务文件形态（示范）

```yaml
# locales/zh-CN/demo.yaml
Users:
  Name: 姓名
  Name_Placeholder: 请输入姓名
  Create_Title: 新建用户
  Delete_Confirm_Content: '将删除用户「{{name}}」，此操作不可撤销。'
```

```tsx
const { t } = useTranslation(['demo', 'common']);

t('Users.Name'); // demo 命名空间
t('common:Actions.Create'); // 复用公共
t('Users.Delete_Confirm_Content', { name: record.name });
```

### 4.3 决策表示例

| 候选文案                    | 决策                                     | 落点                                                        |
| --------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| 「创建」                    | 复用已有                                 | `common:Actions.Create`                                     |
| 「暂无数据」                | 复用已有                                 | `common:General.Empty`                                      |
| 「邮箱」作通用字段          | 复用已有                                 | `common:Fields.Email`（若业务无特殊叫法）                   |
| 「请输入姓名」              | 独有（或可复用 Fields 时仍可能独有占位） | `demo:Users.Name_Placeholder`                               |
| 「将删除用户「{{name}}」…」 | 独有（含业务对象）                       | `demo:Users.Delete_Confirm_Content`                         |
| 「创建成功」（无业务词）    | 可上收公共；多处重复时 MUST 倾向 common  | `common` 或业务大项（若暂仅一处可用业务，出现第二处再上收） |

### 4.4 与列表页 Key 的配合

业务大项内常见叶子（按列表页能力选用），操作类仍优先 `common`：

| 叶子 Key 模式                                     | 归属倾向                                   |
| ------------------------------------------------- | ------------------------------------------ |
| `Actions.*` / `AII_Table.Batch_Delete`            | 公共                                       |
| 字段名、Placeholder、Required、页面标题、确认正文 | 业务大项（字段名可先尝试 `common:Fields`） |
| `Page_Title` / `Toolbar_Hint`                     | 业务大项且可选                             |

## 5. Acceptance Criteria

- **AC-001**: Given 新增业务文案，When 查看 YAML，Then 结构至多为「大项 → 叶子」，无第三层对象。
- **AC-002**: Given 同一功能目录下的列表/表单/确认文案，When 落盘，Then 均在同一命名空间文件的同一或明确分割的大项下，未拆散到多个业务文件。
- **AC-003**: Given 页面使用「创建/取消/删除」等通用操作，When 检查代码，Then 引用 `common:Actions.*`（或既有公共 Key），业务文件无同义重复定义。
- **AC-004**: Given 新增任一 Key，When 对比 `zh-CN` 与 `en-US`，Then 两侧 Key 路径一致。
- **AC-005**: Given AI 或开发者新增文案，When 审查，Then 能说明复用检索结果，以及选择公共或独有的理由。
- **AC-006**: Given 文案含动态值，When 渲染，Then 使用 `{{var}}` 插值而非字符串拼接。

## 6. Test Automation Strategy

- **Test Levels**
  - **Unit**: Key 对称性校验脚本（对比两 locale 的 Key 树）；可选检测 YAML 深度 > 2。
  - **Integration**: 抽样页面切换语言后无缺失 Key 回退噪声（依赖 i18n 配置）。
  - **End-to-End**: 非必须；关键路径目视中英文切换即可。

- **Frameworks**: Vitest 可对 `loadLocaleResources()` 结果做深度与对称断言（引入后）。

- **Test Data Management**: 以仓库内 `locales/**` 为唯一真实来源。

- **CI/CD Integration**: SHOULD 在 CI 增加「中英文 Key 对称」检查；MAY 增加「YAML 最大深度 ≤ 2」检查。

- **Coverage Requirements**: 不强制文案覆盖率；强制「用户可见字符串不进源码」由评审与后续 lint 保障。

- **Performance Testing**: 不适用。

## 7. Rationale & Context

- **单文件大项聚合**：同一目录功能的文案一起改、一起审，避免「组件一份、表单一份、弹窗又一份」导致遗漏翻译。
- **扁平层级**：深嵌套使 Key 难搜、难复用，也容易在 AI 生成时制造 `a.b.c.d` 碎片；用后缀表达结构更稳。
- **先复用再落盘**：BSS 中操作与空态高度同质，不复用会导致几十份「取消」「提交」译文漂移。
- **公共 vs 独有**：含业务对象的确认句必须独有；纯动词/纯状态应公共，保证全局语气一致。

## 8. Dependencies & External Integrations

### External Systems

- 无。

### Third-Party Services

- **SVC-001**: `i18next` / `react-i18next` — 运行时翻译与命名空间加载。

### Infrastructure Dependencies

- **INF-001**: Vite `import.meta.glob` 加载 `locales/*/*.yaml`。

### Data Dependencies

- **DAT-001**: `locales/zh-CN/**`、`locales/en-US/**` 为文案 Source of Truth。

### Technology Platform Dependencies

- **PLT-001**: YAML 解析（`yaml` 包）；默认 NS `common`。

### Compliance Dependencies

- 无额外合规项；企业用语以产品/翻译评审为准。

## 9. Examples & Edge Cases

### 9.1 正确：扁平大项

```yaml
Orders:
  List_Title: 订单列表
  Order_No: 订单号
  Order_No_Placeholder: 请输入订单号
  Delete_Confirm_Content: '将删除订单「{{orderNo}}」，此操作不可撤销。'
```

### 9.2 错误：多层嵌套

```yaml
Orders:
  List:
    Title: 订单列表
  Form:
    Fields:
      Order_No:
        Label: 订单号
```

### 9.3 复用公共 + 独有正文

```tsx
// ✅
okText={t('common:Actions.Delete')}
cancelText={t('common:Actions.Cancel')}
content={t('Orders.Delete_Confirm_Content', { orderNo })}

// ❌ 业务文件再定义 Delete: 删除，或拼接「将删除」+ orderNo
```

### 9.4 边缘情况

| 场景                              | 预期                                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| 只读列表无写操作                  | 不新增 Create/Delete 相关独有 Key                                        |
| 两业务都要「创建成功」            | 上收 `common`（如 `General.Create_Success`），两边改引用                 |
| 业务字段名与 `common:Fields` 同义 | 优先复用 Fields；产品坚持特殊叫法再独有                                  |
| 菜单与页面标题同句                | 菜单仍在 `menu.yaml`；页面标题在业务大项；允许译文相同但 Key 分属不同 NS |
| 旧文件已有三层嵌套                | 修改触及该文件时 SHOULD 拍平为后缀 Key，避免继续加深                     |

## 10. Validation Criteria

- [ ] 用户可见字符串均在 locales，无硬编码
- [ ] 同一功能大项文案在同一 NS 文件，用一级大项 Key 分割
- [ ] YAML 深度 ≤ 2（大项 → 叶子）
- [ ] 新增前已检索并可复用则未新建同义 Key
- [ ] 通用操作/空态/组件壳文案走 `common`（或既有横切 NS）
- [ ] 含业务对象的确认/标题等走业务大项
- [ ] `zh-CN` / `en-US` Key 对称
- [ ] 动态值使用 `{{var}}` 插值

## 11. Related Specifications / Further Reading

- [AII-NEXT 前端基座架构规范](./spec-architecture-aii-next-frontend-base.md)
- [列表页开发规范（查询展示与 CRUD）](./spec-process-crud-list-page.md)
- [代码质量与提交校验规范](./spec-process-lint-format-commit.md)
- [AII-NEXT README](../README.md)
- 参考：`locales/zh-CN/common.yaml`、`locales/zh-CN/demo.yaml`
- 加载实现：`src/i18n/resources.ts`
