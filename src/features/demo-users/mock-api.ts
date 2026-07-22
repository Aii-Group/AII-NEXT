import type { DemoUser, DemoUserFormValues, DemoUserListPayload, DemoUserListResult, DemoUserStatus } from './types';

const DEPARTMENTS = ['平台研发', '交付实施', '产品设计', '运维保障', '质量管理'] as const;

const SEED_USERS: DemoUser[] = Array.from({ length: 28 }, (_, index) => {
  const id = String(index + 1);
  const dept = DEPARTMENTS[index % DEPARTMENTS.length] ?? DEPARTMENTS[0];
  const status: DemoUserStatus = index % 5 === 0 ? 'disabled' : 'enabled';

  return {
    id,
    name: `演示用户 ${id}`,
    email: `user${id}@example.com`,
    department: dept,
    status,
    createdAt: new Date(Date.UTC(2026, 0, 1 + (index % 28), 8, 0, 0)).toISOString(),
  };
});

let users: DemoUser[] = structuredClone(SEED_USERS);
let nextId = users.length + 1;

function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function matchQuery(user: DemoUser, query: Pick<DemoUserListPayload, 'name' | 'email' | 'status'>): boolean {
  if (query.name && !user.name.includes(query.name.trim())) return false;
  if (query.email && !user.email.toLowerCase().includes(query.email.trim().toLowerCase())) return false;
  if (query.status && user.status !== query.status) return false;
  return true;
}

/** 重置为种子数据（便于本地反复演示） */
export async function resetDemoUsers(): Promise<void> {
  await delay(120);
  users = structuredClone(SEED_USERS);
  nextId = users.length + 1;
}

/** 分页查询示例用户 */
export async function listDemoUsers(payload: DemoUserListPayload): Promise<DemoUserListResult> {
  await delay();

  const current = Math.max(1, Number(payload.current) || 1);
  const pageSize = Math.max(1, Number(payload.pageSize) || 10);
  const filtered = users.filter((user) => matchQuery(user, payload));
  const start = (current - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    current,
    pageSize,
  };
}

/** 新建示例用户 */
export async function createDemoUser(values: DemoUserFormValues): Promise<DemoUser> {
  await delay();

  const user: DemoUser = {
    id: String(nextId++),
    name: values.name.trim(),
    email: values.email.trim(),
    department: values.department.trim(),
    status: values.status,
    createdAt: new Date().toISOString(),
  };

  users = [user, ...users];
  return user;
}

/** 更新示例用户 */
export async function updateDemoUser(id: string, values: DemoUserFormValues): Promise<DemoUser> {
  await delay();

  const index = users.findIndex((user) => user.id === id);
  if (index < 0) {
    throw new Error('用户不存在');
  }

  const current = users[index];
  if (!current) {
    throw new Error('用户不存在');
  }

  const next: DemoUser = {
    ...current,
    name: values.name.trim(),
    email: values.email.trim(),
    department: values.department.trim(),
    status: values.status,
  };

  users = users.map((user, i) => (i === index ? next : user));
  return next;
}

/** 删除示例用户 */
export async function deleteDemoUser(id: string): Promise<void> {
  await delay();
  users = users.filter((user) => user.id !== id);
}

/** 批量删除示例用户 */
export async function deleteDemoUsers(ids: string[]): Promise<void> {
  await delay();
  const idSet = new Set(ids);
  users = users.filter((user) => !idSet.has(user.id));
}
