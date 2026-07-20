/** 示例用户状态 */
export type DemoUserStatus = 'enabled' | 'disabled';

/** 示例用户实体 */
export interface DemoUser {
  id: string;
  name: string;
  email: string;
  department: string;
  status: DemoUserStatus;
  createdAt: string;
}

/** 列表示例查询参数 */
export interface DemoUserQuery extends Record<string, unknown> {
  name?: string;
  email?: string;
  status?: DemoUserStatus;
}

/** 新建 / 编辑表单值 */
export interface DemoUserFormValues {
  name: string;
  email: string;
  department: string;
  status: DemoUserStatus;
}

/** 列表请求参数（分页 + 查询） */
export interface DemoUserListPayload extends DemoUserQuery {
  current: number;
  pageSize: number;
}

/** 列表响应 */
export interface DemoUserListResult {
  list: DemoUser[];
  total: number;
  current: number;
  pageSize: number;
}
