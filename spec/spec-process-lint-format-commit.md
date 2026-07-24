---
title: AII-NEXT 代码质量与提交校验规范
version: 1.1
date_created: 2026-07-22
last_updated: 2026-07-24
owner: AII-NEXT 维护团队
tags: [process, tooling, lint, format, git, husky, oxlint, oxfmt]
---

# Introduction

本规范定义 **AII-NEXT** 工程在本地开发与 Git 提交时的**代码质量门禁**：静态检查（Oxlint）、格式化（Oxfmt）、类型检查（TypeScript）以及提交信息约定（Commitlint）。目标是保证所有进入版本库的变更都经过同一套可复现校验，便于人工审查与 Generative AI 一致地生成合规代码。

## 1. Purpose & Scope

### 目的

- 统一 Lint / Format 工具与配置入口，禁止继续引入 ESLint / Prettier 作为项目默认方案。
- 强制 **提交前校验**：敏感文件拦截、暂存区修复、类型检查、全量 lint、格式检查。
- 约定 Commit Message 格式，保证变更历史可检索。

### 范围

本规范适用于：

- 仓库内所有由开发者或 AI 助手新增 / 修改的源代码、样式、配置与文档（在 Oxfmt 覆盖范围内的文件）。
- 本地 `git commit` 流程（Husky hooks）。
- 日常开发中的手动质量校验命令。

本规范**不**覆盖：

- CI 流水线的具体平台配置（本规范要求的校验命令可被 CI 复用，但流水线编排不在此定义）。
- 业务功能验收、E2E / 视觉回归测试。
- 后端契约或运行时监控告警。

### 受众

- 前端业务开发工程师
- 代码审查人员
- 使用 Generative AI 辅助改码、提交的工具链

### 假设

- 运行环境为 Node.js 20+、pnpm 9+。
- 已执行 `pnpm install`（会通过 `prepare` 安装 Husky hooks）。
- 开发者使用本仓库的 Git hooks，不得默认跳过 hooks（见 CON-003）。

## 2. Definitions

| 术语                    | 定义                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Oxlint**              | 基于 Oxc 的 JS/TS Linter；项目配置为 `.oxlintrc.json`。                             |
| **Oxfmt**               | 基于 Oxc 的代码格式化器；项目配置为 `.oxfmtrc.json`。                               |
| **deny-warnings**       | Oxlint CLI 选项：将 warning 视为失败（非零退出码）。                                |
| **lint-staged**         | 仅对 Git 暂存文件执行命令的工具；配置位于 `package.json` 的 `lint-staged` 字段。    |
| **Husky**               | Git hooks 管理工具；本仓库使用 `.husky/pre-commit` 与 `.husky/commit-msg`。         |
| **pre-commit**          | 执行 `git commit` 写入对象前触发的 hook；失败则提交中止。                           |
| **commit-msg**          | 校验提交说明的 hook；由 Commitlint 执行。                                           |
| **Commitlint**          | 校验 commit message 是否符合 Conventional Commits；配置为 `commitlint.config.mjs`。 |
| **validate**            | 脚本 `pnpm validate`：`typecheck` + `lint` + `format:check`，用于手动全量校验。     |
| **Conventional Commit** | 形如 `type(scope): subject` 的提交说明约定；本仓库强制 `type` 枚举见 §3。           |

## 3. Requirements, Constraints & Guidelines

### 工具与配置

- **REQ-001**: 静态检查 MUST 使用 Oxlint；配置文件 MUST 为仓库根目录 `.oxlintrc.json`。
- **REQ-002**: 代码格式化 MUST 使用 Oxfmt；配置文件 MUST 为仓库根目录 `.oxfmtrc.json`。
- **REQ-003**: 项目 MUST NOT 将 ESLint 或 Prettier 作为默认 lint / format 方案重新引入（文档、脚本、编辑器默认格式化器均以 Oxc 为准）。
- **REQ-004**: `pnpm lint` MUST 等价于 `oxlint --deny-warnings .`（warning 不得放行）。
- **REQ-005**: `pnpm format` MUST 等价于 `oxfmt`；`pnpm format:check` MUST 等价于 `oxfmt --check`。
- **REQ-006**: `pnpm typecheck` MUST 等价于 `tsc -b`。
- **REQ-007**: `pnpm validate` MUST 顺序执行 `typecheck`、`lint`、`format:check`；任一失败 MUST 非零退出。

### Oxlint 规则基线

- **REQ-010**: Oxlint categories MUST 开启为 error：`correctness`、`suspicious`、`pedantic`、`perf`。
- **REQ-011**: Oxlint categories MUST 关闭：`style`、`restriction`、`nursery`（除非经维护团队评审后修订本规范与配置）。
- **REQ-012**: Oxlint plugins MUST 至少包含：`typescript`、`react`、`unicorn`、`oxc`、`import`、`jsx-a11y`、`promise`。
- **REQ-013**: 下列规则 MUST 保持开启（error，除非配置中另有明确选项）：
  - React：`react/rules-of-hooks`、`react/exhaustive-deps`、`react/button-has-type` 等（详见 `.oxlintrc.json`）
  - TypeScript：`typescript/no-explicit-any`、`typescript/ban-ts-comment`、`typescript/no-non-null-assertion`
  - 通用：`eqeqeq`（允许 `== null` / `!= null`）、`no-unused-vars`（`_` 前缀忽略）、`prefer-const`、`no-var`、`no-debugger`、`no-alert`
  - `no-console`：仅允许 `console.warn` / `console.error`（脚本与指定生成文件除外，见 override）
  - `import/no-duplicates`、`unicorn/no-abusive-eslint-disable`
- **REQ-014**: 为适配 React 17+ JSX 运行时与 TypeScript `import type` 习惯，下列规则 MUST 保持关闭（完整列表以 `.oxlintrc.json` 为准）：`react/react-in-jsx-scope`、`no-duplicate-imports`、`unicorn/no-null`，以及各类风格向规则（如 `max-lines*`、`sort-keys`、`id-length` 等）。
- **GUD-001**: 新增规则或插件前 SHOULD 先在本地全量跑通 `pnpm lint`，评估误报与改造成本，再合入配置。
- **GUD-002**: 必要抑制 MUST 使用 `oxlint-disable-next-line <rule>`（或等价指令），并在相邻注释说明原因；禁止无理由的大范围 disable。

### Oxfmt 基线

- **REQ-020**: Oxfmt MUST 保留与既有风格一致的关键选项：`printWidth: 140`、`singleQuote: true`、`jsxSingleQuote: true`、`trailingComma: "all"`、`singleAttributePerLine: true`、`endOfLine: "lf"` 等（以 `.oxfmtrc.json` 为准）。
- **REQ-021**: Tailwind class 排序 MUST 通过 Oxfmt `sortTailwindcss` 完成，stylesheet 指向 `./src/index.css`。
- **CON-001**: 生成文件与锁文件（如 `src/routeTree.gen.ts`、`pnpm-lock.yaml`、主题同步产物 `src/theme/antd-tokens.css`）MUST 列入 ignore（见 `.oxfmtrc.json` / `.oxlintrc.json`），不得为通过校验而手改生成物的格式期望。

### 提交前强制门禁（pre-commit）

- **REQ-030**: 每次 `git commit` MUST 触发 `.husky/pre-commit`；失败则 MUST 中止提交。
- **REQ-031**: pre-commit MUST 按下列顺序执行：
  1. **敏感文件拦截**：若暂存包含 `.env`、`.env.local`、`.env.*.local`、`credentials.json`、`*.pem`、`id_rsa` 等，MUST 失败并打印命中路径。
  2. **lint-staged**：
     - `*.{ts,tsx,js,jsx,mjs,cjs}` → `oxlint --fix --deny-warnings`，再 `oxfmt`
     - `*.{json,css,scss,less,md,mdx,yaml,yml,html}` → `oxfmt`
  3. **typecheck**（条件触发）：若暂存包含 `.(ts|tsx|mts|cts|js|jsx|mjs|cjs)` 或 `tsconfig*.json`，MUST 执行 `pnpm typecheck`。
  4. **全量 lint**：MUST 执行 `pnpm lint`。
  5. **全量格式检查**：MUST 执行 `pnpm format:check`。
- **REQ-032**: 提交信息 MUST 通过 `.husky/commit-msg` → Commitlint。
- **REQ-033**: Commit message 的 `type` MUST 属于：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。
- **REQ-034**: Commit message MUST 非空 `type` 与 `subject`；header 长度 MUST ≤ 72；`subject` MUST NOT 使用 start-case / pascal-case / upper-case（见 `commitlint.config.mjs`）。
- **CON-002**: 仅修改 Markdown / 纯非源码配置时，可跳过 typecheck（由 pre-commit 条件逻辑自动处理）；但仍 MUST 通过 lint 与 format:check。
- **CON-003**: MUST NOT 使用 `--no-verify` / `--no-gpg-sign` 等方式跳过 hooks，除非维护团队书面批准的紧急热修，并在事后补跑 `pnpm validate` 与说明。

### 编辑器

- **REQ-040**: 工作区编辑器默认格式化器 MUST 为 `oxc.oxc-vscode`（见 `.vscode/settings.json`）。
- **REQ-041**: `.vscode/extensions.json` MUST 推荐 `oxc.oxc-vscode`。
- **GUD-003**: 贡献者 SHOULD 安装 Oxc 扩展并开启 format on save，以减少 pre-commit 反复失败。

### 开发者日常命令

- **PAT-001**: 提交前本地自检优先使用：

```bash
pnpm validate
```

- **PAT-002**: 仅格式化工作区：

```bash
pnpm format
```

- **PAT-003**: 仅检查提交信息（可选）：

```bash
pnpm lint:commit
```

## 4. Interfaces & Data Contracts

### 4.1 npm scripts 契约

| Script         | 命令实质                                       | 失败语义           |
| -------------- | ---------------------------------------------- | ------------------ |
| `lint`         | `oxlint --deny-warnings .`                     | 有 error/warning   |
| `format`       | `oxfmt`（写回）                                | 工具执行失败       |
| `format:check` | `oxfmt --check`                                | 存在未格式化文件   |
| `typecheck`    | `tsc -b`                                       | 类型错误           |
| `validate`     | `typecheck && lint && format:check`            | 任一子命令失败     |
| `lint:commit`  | `commitlint --from HEAD~1 --to HEAD --verbose` | 最近提交信息不合法 |
| `prepare`      | `husky`                                        | hooks 安装失败     |

### 4.2 配置文件契约

| 路径                       | 职责                                      |
| -------------------------- | ----------------------------------------- |
| `.oxlintrc.json`           | Oxlint 插件、categories、rules、overrides |
| `.oxfmtrc.json`            | Oxfmt 选项、Tailwind 排序、ignorePatterns |
| `commitlint.config.mjs`    | Conventional Commits 规则                 |
| `.husky/pre-commit`        | 提交前门禁编排                            |
| `.husky/commit-msg`        | 提交信息校验入口                          |
| `package.json#lint-staged` | 暂存文件命令映射                          |
| `.vscode/settings.json`    | 编辑器默认 Oxc 格式化                     |

### 4.3 Git Hook 输入

- **pre-commit** 输入：当前 index 中暂存文件列表（`git diff --cached --name-only --diff-filter=ACMR`）。
- **commit-msg** 输入：即将写入的 commit message 文件路径（`$1`）。

## 5. Acceptance Criteria

- **AC-001**: Given 开发者暂存了含 `console.log` 的 TS 源码，When 执行 `git commit`，Then pre-commit 因 `no-console` / lint 失败而中止。
- **AC-002**: Given 开发者暂存了未按 Oxfmt 格式化的文件，When 执行 `git commit`，Then lint-staged 先写回格式，或最终 `format:check` 失败导致中止（最终工作区与提交内容 MUST 符合 Oxfmt）。
- **AC-003**: Given 开发者暂存了 TypeScript 类型错误，When 执行 `git commit`，Then `pnpm typecheck` 失败且提交中止。
- **AC-004**: Given 开发者尝试暂存 `.env` 或私钥文件，When 执行 `git commit`，Then pre-commit 打印命中路径并以非零退出。
- **AC-005**: Given 提交说明为 `Update stuff`（无 type），When 执行 `git commit`，Then commit-msg / Commitlint 失败。
- **AC-006**: Given 工作区干净且代码合规，When 执行 `pnpm validate`，Then 三个子命令均成功退出。
- **AC-007**: Given 仅修改 `README.md`，When 执行 `git commit`，Then 可跳过 typecheck，但仍须通过 lint-staged（若匹配）、全量 lint 与 format:check。

## 6. Test Automation Strategy

- **Test Levels**：本规范门禁属于 **静态质量门禁**（lint / format / typecheck），不替代单元 / E2E 测试。
- **Frameworks**：Oxlint、Oxfmt、TypeScript Compiler、Commitlint、Husky、lint-staged。
- **Local verification**：
  - 改配置后 MUST 跑 `pnpm validate`。
  - 改 hooks 后 SHOULD 用一次真实 `git commit`（或空提交演练前先确认 hooks 可执行）验证失败路径。
- **CI/CD Integration**：CI SHOULD 至少执行 `pnpm validate`（或等价拆分命令）；不得弱于本地 pre-commit 的 lint / typecheck / format 标准。
- **Coverage Requirements**：不适用（静态门禁无覆盖率指标）。

## 7. Rationale & Context

- 选用 **Oxlint / Oxfmt** 替代 ESLint / Prettier，以降低依赖体积与执行时延，并与 Oxc 编辑器扩展统一。
- **deny-warnings** 避免「只修 error、堆积 warning」导致质量漂移。
- **lint-staged + 全量 lint** 组合：暂存阶段快速 autofix，全量阶段防止未暂存脏文件或跨文件规则遗漏。
- **条件 typecheck**：纯文档提交不必承担完整 `tsc` 成本；源码变更必须类型安全。
- **敏感文件拦截** 放在最前，避免密钥进入对象库后再补救。
- **Conventional Commits** 便于 changelog 与回溯；type 枚举与团队现有约定对齐。

## 8. Dependencies & External Integrations

### External Systems

- 无强制外部系统依赖（校验均在本地 / CI 运行）。

### Third-Party Services

- 无。

### Infrastructure Dependencies

- **INF-001**：Git 仓库与可执行的 Husky hooks（`prepare` 安装）。
- **INF-002**：Node.js 20+ 与 pnpm 9+。

### Data Dependencies

- **DAT-001**：以仓库内 `.oxlintrc.json`、`.oxfmtrc.json`、`commitlint.config.mjs` 为配置 Source of Truth。

### Technology Platform Dependencies

- **PLT-001**：Oxlint、Oxfmt、TypeScript、Husky、lint-staged、Commitlint。
- **PLT-002**：编辑器侧推荐 Oxc VS Code / Cursor 扩展（`oxc.oxc-vscode`）。

### Compliance Dependencies

- **COM-001**：禁止将密钥与本地环境文件提交进库（与安全基线一致）。

## 9. Examples & Edge Cases

### 9.1 合规提交说明

```text
feat(table): support sticky selection alert
fix(auth): clear stale user when host omits identity
docs: add lint and commit validation spec
chore(tooling): tighten pre-commit gates
```

### 9.2 不合规提交说明

```text
Update stuff
FEAT: Add Button
fix: Fixed Bug.
```

### 9.3 本地自检与修复

```bash
# 全量门禁（与提交关键路径对齐）
pnpm validate

# 若 format:check 失败
pnpm format

# 若 lint 失败：按 oxlint 输出修复；必要时
pnpm exec oxlint --fix --deny-warnings .
```

### 9.4 边缘情况

| 场景                                    | 预期                                                               |
| --------------------------------------- | ------------------------------------------------------------------ |
| 只改 `readme/*.md`                      | 跳过 typecheck；仍跑 lint-staged（oxfmt）、全量 lint、format:check |
| `oxlint --fix` 后仍有不可自动修复的问题 | lint-staged 或全量 lint 失败，提交中止                             |
| 生成的 `routeTree.gen.ts` 被改动        | 应被 ignore；业务不得手改该文件                                    |
| 用户级编辑器仍绑定 Prettier             | 工作区语言级 `editor.defaultFormatter` 覆盖为 Oxc（见 `.vscode`）  |
| 紧急跳过 hooks                          | 仅允许例外流程；事后 MUST `pnpm validate` 并补说明（CON-003）      |
| iframe 等安全规则误报 / 产品必要例外    | 使用带原因的 `oxlint-disable-next-line`，禁止静默大范围关闭插件    |

## 10. Validation Criteria

- [ ] 仓库无 ESLint / Prettier 作为默认脚本或推荐扩展
- [ ] `.oxlintrc.json` / `.oxfmtrc.json` 存在且与本规范基线一致
- [ ] `package.json` 含 `lint` / `format` / `format:check` / `validate` / `lint-staged`
- [ ] `.husky/pre-commit` 含敏感文件、lint-staged、条件 typecheck、全量 lint、format:check
- [ ] `.husky/commit-msg` 调用 Commitlint
- [ ] `pnpm validate` 在干净合规工作区通过
- [ ] 故意引入 `console.log` 或类型错误时，`git commit` 被拒绝
- [ ] README「规范」索引已链接本文档

## 11. Related Specifications / Further Reading

- [AII-NEXT 前端基座架构规范](./spec-architecture-aii-next-frontend-base.md)
- [列表页开发规范（查询展示与 CRUD）](./spec-process-crud-list-page.md)
- [列表页三位一体设计规范](./spec-design-list-page-trinity.md)
- [国际化文案规范](./spec-process-i18n-locale.md)
- [AII-NEXT README](../README.md) — 脚本说明与快速开始
- [Oxlint 配置参考](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html)
- [Oxfmt 配置参考](https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- 实现文件：`.husky/pre-commit`、`.husky/commit-msg`、`.oxlintrc.json`、`.oxfmtrc.json`、`commitlint.config.mjs`
