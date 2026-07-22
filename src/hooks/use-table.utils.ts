import type { FilterValue, SorterResult } from 'antd/es/table/interface';

/** 请求参数字段映射 */
export interface TableRequestFieldNames {
  /** 页码字段，如 `current` / `pageNum` / `page` */
  current?: string;
  /** 每页条数字段，如 `pageSize` / `size` */
  pageSize?: string;
}

/** 响应字段映射 */
export interface TableResponseFieldNames {
  /** 列表字段，如 `list` / `data` / `records` / `rows` */
  list?: string;
  /** 总数字段 */
  total?: string;
  /** 当前页字段 */
  current?: string;
  /** 每页条数字段 */
  pageSize?: string;
  /**
   * 数据根路径，点分隔。
   * 如 `data` 表示从 `response.data` 读取列表与分页信息。
   */
  root?: string;
}

export interface TableFieldNames {
  /** 请求参数字段映射 */
  request?: TableRequestFieldNames;
  /** 响应数据字段映射 */
  response?: TableResponseFieldNames;
}

export interface ResolvedTableFieldNames {
  /** 已补默认值的请求参数字段映射 */
  request: Required<TableRequestFieldNames>;
  /** 已补默认值的响应数据字段映射 */
  response: Required<TableResponseFieldNames>;
}

/** 默认风格：current + pageSize，响应 list + total */
export const DEFAULT_TABLE_FIELD_NAMES: ResolvedTableFieldNames = {
  request: {
    current: 'current',
    pageSize: 'pageSize',
  },
  response: {
    list: 'list',
    total: 'total',
    current: 'current',
    pageSize: 'pageSize',
    root: '',
  },
};

/** 可作为表格数据源的异步接口函数 */
export type TableApi = (...args: never[]) => Promise<unknown>;

/** 表格 api 的首个请求参数类型 */
export type TableApiPayload<TApi extends TableApi> = TApi extends (payload?: infer Payload, ...args: infer _Rest) => Promise<unknown>
  ? NonNullable<Payload>
  : Record<string, unknown>;

/** 表格 api 的响应类型 */
export type TableApiResponse<TApi extends TableApi> = Awaited<ReturnType<TApi>>;

type PathValue<Source, Path extends string> = Path extends ''
  ? Source
  : Path extends `${infer Head}.${infer Tail}`
    ? Head extends keyof NonNullable<Source>
      ? PathValue<NonNullable<Source>[Head], Tail>
      : unknown
    : Path extends keyof NonNullable<Source>
      ? NonNullable<Source>[Path]
      : unknown;

type ResponseRootPath<FieldNames> = FieldNames extends { response: { root: infer Root extends string } } ? Root : '';

type ResponseListKey<FieldNames> = FieldNames extends { response: { list: infer List extends string } } ? List : 'list';

type KnownListValue<Source> = Source extends {
  list?: infer List;
}
  ? List
  : Source extends { data?: infer Data }
    ? Data
    : Source extends { records?: infer Records }
      ? Records
      : Source extends { rows?: infer Rows }
        ? Rows
        : unknown;

type ResponseListValue<Response, FieldNames> =
  ResponseListKey<FieldNames> extends keyof NonNullable<PathValue<Response, ResponseRootPath<FieldNames>>>
    ? NonNullable<PathValue<Response, ResponseRootPath<FieldNames>>>[ResponseListKey<FieldNames>]
    : KnownListValue<PathValue<Response, ResponseRootPath<FieldNames>>>;

type ArrayItem<Value> = NonNullable<Value> extends readonly (infer Item)[] ? NonNullable<Item> : never;

/** 按响应字段映射从 api 响应中推导表格行类型 */
export type TableRecordFromApi<TApi extends TableApi, FieldNames> =
  ArrayItem<ResponseListValue<TableApiResponse<TApi>, FieldNames>> extends infer RecordType
    ? RecordType extends object
      ? RecordType
      : object
    : object;

/**
 * 判断值是否为可读取字段的对象。
 *
 * @param value 待判断的值。
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 按点分路径读取对象字段。
 *
 * @param source 数据源。
 * @param path 点分路径；空字符串返回 source。
 */
function getByPath(source: unknown, path: string): unknown {
  if (!path) return source;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!isRecord(acc)) return undefined;
    return acc[key];
  }, source);
}

/**
 * 从多个候选字段中读取第一个有效数字。
 *
 * @param source 数据源对象。
 * @param keys 候选字段名。
 */
function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

/**
 * 从指定字段读取数组列表。
 *
 * @param source 数据源对象。
 * @param key 列表字段名。
 */
function pickList<RecordType>(source: Record<string, unknown>, key: string): RecordType[] | undefined {
  const value = source[key];
  return Array.isArray(value) ? (value as RecordType[]) : undefined;
}

/**
 * 合并字段映射预设和自定义字段映射。
 *
 * @param fieldNames 字段映射对象。
 */
export function resolveTableFieldNames(fieldNames?: TableFieldNames): ResolvedTableFieldNames {
  return {
    request: {
      ...DEFAULT_TABLE_FIELD_NAMES.request,
      ...fieldNames?.request,
    },
    response: {
      ...DEFAULT_TABLE_FIELD_NAMES.response,
      ...fieldNames?.response,
    },
  };
}

/**
 * 构造传给表格 api 的请求参数。
 *
 * @param params 表格请求上下文。
 * @param fieldNames 字段映射对象。
 */
export function buildRequestPayload<Params extends Record<string, unknown> = Record<string, unknown>>(
  params: TableRequestParams<Params>,
  fieldNames?: TableFieldNames,
): Record<string, unknown> {
  const resolved = resolveTableFieldNames(fieldNames);
  const { current, pageSize, extraParams } = params;

  return {
    ...extraParams,
    [resolved.request.current]: current,
    [resolved.request.pageSize]: pageSize,
  };
}

/**
 * 将后端响应归一化为表格分页结果。
 *
 * @param response 后端原始响应。
 * @param fieldNames 字段映射对象。
 */
export function normalizeTableResponse<RecordType extends object = object>(
  response: unknown,
  fieldNames?: TableFieldNames,
): TableRequestResult<RecordType> {
  const resolved = resolveTableFieldNames(fieldNames);
  const source = getByPath(response, resolved.response.root);

  if (!isRecord(source)) {
    return { list: [], total: 0 };
  }

  const list =
    pickList<RecordType>(source, resolved.response.list) ??
    pickList<RecordType>(source, 'list') ??
    pickList<RecordType>(source, 'data') ??
    pickList<RecordType>(source, 'records') ??
    pickList<RecordType>(source, 'rows') ??
    [];

  const total = pickNumber(source, [resolved.response.total, 'total', 'count', 'totalCount', 'totalElements']) ?? list.length;

  const current = pickNumber(source, [resolved.response.current, 'current', 'pageNum', 'page']);

  const pageSize = pickNumber(source, [resolved.response.pageSize, 'pageSize', 'size']);

  return {
    list,
    total,
    current,
    pageSize,
  };
}

export type { FilterValue, SorterResult };

export interface TablePaginationState {
  /** 当前页 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** 总条数 */
  total: number;
}

export interface TableRequestParams<
  Params extends Record<string, unknown> = Record<string, unknown>,
  Payload extends Record<string, unknown> = Record<string, unknown>,
> {
  /** antd 风格页码，从 1 开始 */
  current: number;
  /** 每页条数 */
  pageSize: number;
  /** antd Table 筛选状态 */
  filters: Record<string, FilterValue | null>;
  /** antd Table 排序状态 */
  sorter: SorterResult | SorterResult[];
  /** 透传给 api 的额外参数 */
  extraParams?: Params;
  /** 按 fieldNames 映射后的请求体，可直接传给接口 */
  payload: Payload;
}

export interface TableRequestResult<RecordType extends object = object> {
  /** 表格列表数据 */
  list: RecordType[];
  /** 总条数 */
  total: number;
  /** 后端返回的当前页，可选 */
  current?: number;
  /** 后端返回的每页条数，可选 */
  pageSize?: number;
}
