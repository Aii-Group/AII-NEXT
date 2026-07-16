import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { TablePaginationConfig, TableProps } from 'antd';
import type { FilterValue, Key, SorterResult } from 'antd/es/table/interface';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_ROW_KEY,
  getSelectedRows,
  type AIITablePaginationMode,
  type AIITableProps,
  type AIITableSelectionInfo,
  type AIITableSelectionType,
} from '@/components/AIITable';
import {
  buildRequestPayload,
  normalizeTableResponse,
  resolveTableFieldNames,
  type TableApi,
  type TableApiPayload,
  type TableApiResponse,
  type TableFieldNames,
  type TablePaginationState,
  type TableRecordFromApi,
  type TableRequestParams,
  type TableRequestResult,
} from '@/hooks/use-table.utils';

export type {
  ResolvedTableFieldNames,
  TableApi,
  TableApiPayload,
  TableApiResponse,
  TableFieldNames,
  TablePaginationState,
  TableRecordFromApi,
  TableRequestFieldNames,
  TableRequestParams,
  TableRequestResult,
  TableResponseFieldNames,
} from '@/hooks/use-table.utils';
export { buildRequestPayload, DEFAULT_TABLE_FIELD_NAMES, normalizeTableResponse, resolveTableFieldNames } from '@/hooks/use-table.utils';

export interface UseTableOptions<
  RecordType extends object = object,
  TApi extends TableApi = TableApi,
  Params extends Record<string, unknown> = Record<string, unknown>,
  FieldNames extends TableFieldNames | undefined = TableFieldNames | undefined,
> {
  /** 静态数据源；未传 api 时使用，不会自动请求 */
  dataSource?: NoInfer<RecordType>[];
  /** 透传给 api 的额外参数 */
  params?: Params;
  /** 表格行主键 */
  rowKey?: TableProps<NoInfer<RecordType>>['rowKey'];
  /** 默认每页条数 */
  defaultPageSize?: number;
  /** 默认当前页 */
  defaultCurrent?: number;
  /** 为 true 时不自动发起首次请求 */
  manual?: boolean;
  /** 为 false 时暂停请求 */
  ready?: boolean;
  /** 依赖变化时自动 refresh，并重置到第一页 */
  refreshDeps?: readonly unknown[];
  /** 请求/响应字段映射；未传时使用 antd 规则：current/pageSize -> list/total */
  fieldNames?: FieldNames;
  /** 将 hook 内部的分页/筛选/排序参数转换为接口入参 */
  mapPayload?: (params: TableRequestParams<Params>) => TableApiPayload<TApi>;
  /** 自定义接口响应归一化；未传时按 fieldNames 自动归一化 */
  mapResponse?: (response: TableApiResponse<TApi>) => TableRequestResult<NoInfer<RecordType>>;
  /** AIITable 分页展示模式 */
  paginationMode?: AIITablePaginationMode;
  /** 透传/覆盖 antd Table pagination 配置；false 关闭分页 */
  pagination?: AIITableProps<NoInfer<RecordType>>['pagination'];
  /** 行选择类型 */
  selectionType?: AIITableSelectionType;
  /** 默认选中的行 key */
  defaultSelectedRowKeys?: Key[];
  /** 行选择变化回调 */
  onSelectionChange?: (selectedRowKeys: Key[], selectedRows: NoInfer<RecordType>[], info: AIITableSelectionInfo) => void;
  /** 请求成功回调 */
  onSuccess?: (result: TableRequestResult<NoInfer<RecordType>>, params: TableRequestParams<Params>) => void;
  /** 请求失败回调 */
  onError?: (error: unknown) => void;
}

export interface UseTableResult<RecordType extends object = object, Params extends Record<string, unknown> = Record<string, unknown>> {
  /** 可直接传给 AIITable 的受控属性 */
  tableProps: Pick<
    AIITableProps<RecordType>,
    | 'loading'
    | 'dataSource'
    | 'pagination'
    | 'onChange'
    | 'rowKey'
    | 'selectedRowKeys'
    | 'onSelectionChange'
    | 'selectionType'
    | 'paginationMode'
  >;
  /** 请求加载状态 */
  loading: boolean;
  /** 当前表格数据 */
  dataSource: RecordType[];
  /** 当前分页状态 */
  pagination: TablePaginationState;
  /** 当前筛选状态 */
  filters: Record<string, FilterValue | null>;
  /** 当前排序状态 */
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[];
  /** 当前选中行 key */
  selectedRowKeys: Key[];
  /** 当前选中行数据 */
  selectedRows: RecordType[];
  /** 按当前分页/筛选/排序重新请求 */
  refresh: () => Promise<void>;
  /** 重置分页/筛选/排序后重新请求 */
  reset: () => Promise<void>;
  /** 清空选择 */
  clearSelection: () => void;
  /** 手动设置数据源 */
  setDataSource: Dispatch<SetStateAction<RecordType[]>>;
  /** 手动设置分页状态 */
  setPagination: Dispatch<SetStateAction<TablePaginationState>>;
  /** 合并额外参数并从第一页请求 */
  run: (patch?: Partial<Params>) => Promise<void>;
}

interface FetchOverrides {
  /** 本次请求使用的筛选状态 */
  filters?: Record<string, FilterValue | null>;
  /** 本次请求使用的排序状态 */
  sorter?: SorterResult | SorterResult[];
}

/**
 * 创建传给表格 api 的请求上下文。
 *
 * @param nextPagination 下一次请求使用的分页状态。
 * @param requestFilters 下一次请求使用的筛选状态。
 * @param requestSorter 下一次请求使用的排序状态。
 * @param extraParams 透传给 api 的额外参数。
 * @param patch 本次 run 调用临时合并的参数。
 * @param fieldNames 已解析的请求/响应字段映射。
 */
function createRequestParams<Params extends Record<string, unknown>>(
  nextPagination: Pick<TablePaginationState, 'current' | 'pageSize'>,
  requestFilters: Record<string, FilterValue | null>,
  requestSorter: SorterResult | SorterResult[],
  extraParams: Params | undefined,
  patch: Partial<Params> | undefined,
  fieldNames: ReturnType<typeof resolveTableFieldNames>,
): TableRequestParams<Params> {
  const mergedExtraParams = {
    ...(extraParams ?? ({} as Params)),
    ...patch,
  };

  const baseParams = {
    current: nextPagination.current,
    pageSize: nextPagination.pageSize,
    filters: requestFilters,
    sorter: requestSorter,
    extraParams: mergedExtraParams,
  };

  return {
    ...baseParams,
    payload: buildRequestPayload(
      {
        ...baseParams,
        payload: {},
      },
      fieldNames,
    ),
  };
}

/**
 * 表格数据请求与 antd Table 状态适配 hook。
 *
 * @param api 表格数据接口；传空时仅使用静态 dataSource。
 * @param options 表格请求、分页、选择和字段映射配置。
 */
export function useTable<
  TApi extends TableApi = TableApi,
  FieldNames extends TableFieldNames | undefined = undefined,
  RecordType extends object = TableRecordFromApi<TApi, FieldNames>,
  Params extends Record<string, unknown> = Record<string, unknown>,
>(api: TApi | null | undefined, options: UseTableOptions<RecordType, TApi, Params, FieldNames> = {}): UseTableResult<RecordType, Params> {
  const {
    dataSource: staticDataSource,
    params,
    rowKey = DEFAULT_ROW_KEY,
    defaultPageSize = DEFAULT_PAGE_SIZE,
    defaultCurrent = 1,
    manual = false,
    ready = true,
    refreshDeps = [],
    fieldNames,
    mapPayload,
    mapResponse,
    paginationMode,
    pagination: paginationProp,
    selectionType,
    defaultSelectedRowKeys,
    onSelectionChange,
    onSuccess,
    onError,
  } = options;

  const apiRef = useRef(api);
  apiRef.current = api;

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const mapPayloadRef = useRef(mapPayload);
  mapPayloadRef.current = mapPayload;

  const mapResponseRef = useRef(mapResponse);
  mapResponseRef.current = mapResponse;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const resolvedFieldNames = useMemo(() => resolveTableFieldNames(fieldNames), [fieldNames]);

  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<RecordType[]>(staticDataSource ?? []);
  const [pagination, setPagination] = useState<TablePaginationState>(() => ({
    current: defaultCurrent,
    pageSize: defaultPageSize,
    total: staticDataSource?.length ?? 0,
  }));
  const [filters, setFilters] = useState<Record<string, FilterValue | null>>({});
  const [sorter, setSorter] = useState<SorterResult<RecordType> | SorterResult<RecordType>[]>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>(defaultSelectedRowKeys ?? []);

  const isRemote = Boolean(api);

  const fetchData = useCallback(
    async (nextPagination: Pick<TablePaginationState, 'current' | 'pageSize'>, patch?: Partial<Params>, overrides?: FetchOverrides) => {
      const currentApi = apiRef.current;
      if (!currentApi) return;

      const requestFilters = overrides?.filters ?? filters;
      const requestSorter = overrides?.sorter ?? sorter;

      const requestParams = createRequestParams(
        nextPagination,
        requestFilters,
        requestSorter,
        paramsRef.current,
        patch,
        resolvedFieldNames,
      );

      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const payload = mapPayloadRef.current?.(requestParams) ?? (requestParams.payload as TableApiPayload<TApi>);
        const rawResult = await (currentApi as unknown as (payload: TableApiPayload<TApi>) => Promise<TableApiResponse<TApi>>)(payload);
        const result = mapResponseRef.current?.(rawResult) ?? normalizeTableResponse<RecordType>(rawResult, resolvedFieldNames);
        if (requestId !== requestIdRef.current) return;

        setDataSource(result.list);
        setPagination((prev) => ({
          ...prev,
          current: result.current ?? nextPagination.current,
          pageSize: result.pageSize ?? nextPagination.pageSize,
          total: result.total,
        }));
        onSuccessRef.current?.(result, requestParams);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        onErrorRef.current?.(error);
        throw error;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [filters, resolvedFieldNames, sorter],
  );

  const run = useCallback(
    async (patch?: Partial<Params>) => {
      if (!isRemote || !ready) return;

      if (patch) {
        paramsRef.current = {
          ...(paramsRef.current ?? ({} as Params)),
          ...patch,
        };
      }

      setPagination((prev) => ({ ...prev, current: defaultCurrent }));
      await fetchData({ current: defaultCurrent, pageSize: pagination.pageSize }, patch);
    },
    [defaultCurrent, fetchData, isRemote, pagination.pageSize, ready],
  );

  const refresh = useCallback(async () => {
    if (!isRemote || !ready) return;
    await fetchData({ current: pagination.current, pageSize: pagination.pageSize });
  }, [fetchData, isRemote, pagination.current, pagination.pageSize, ready]);

  const reset = useCallback(async () => {
    if (!isRemote || !ready) return;

    const emptyFilters: Record<string, FilterValue | null> = {};
    const emptySorter: SorterResult = {};

    setFilters(emptyFilters);
    setSorter(emptySorter);
    setPagination((prev) => ({
      ...prev,
      current: defaultCurrent,
      pageSize: defaultPageSize,
    }));

    await fetchData({ current: defaultCurrent, pageSize: defaultPageSize }, undefined, { filters: emptyFilters, sorter: emptySorter });
  }, [defaultCurrent, defaultPageSize, fetchData, isRemote, ready]);

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
    onSelectionChange?.([], [], { type: 'none' });
  }, [onSelectionChange]);

  const handleSelectionChange = useCallback(
    (keys: Key[], rows: RecordType[], info: AIITableSelectionInfo) => {
      setSelectedRowKeys(keys);
      onSelectionChange?.(keys, rows, info);
    },
    [onSelectionChange],
  );

  const handleTableChange = useCallback<NonNullable<TableProps<RecordType>['onChange']>>(
    (nextPagination, nextFilters, nextSorter) => {
      const nextCurrent = nextPagination.current ?? defaultCurrent;
      const nextPageSize = nextPagination.pageSize ?? pagination.pageSize;

      setFilters(nextFilters);
      setSorter(nextSorter);
      setPagination((prev) => ({
        ...prev,
        current: nextCurrent,
        pageSize: nextPageSize,
      }));

      if (isRemote && ready) {
        void fetchData({ current: nextCurrent, pageSize: nextPageSize }, undefined, { filters: nextFilters, sorter: nextSorter });
      }
    },
    [defaultCurrent, fetchData, isRemote, pagination.pageSize, ready],
  );

  useEffect(() => {
    if (!isRemote || manual || !ready) return;
    void fetchData({ current: defaultCurrent, pageSize: defaultPageSize });
    // refreshDeps intentionally drives re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRemote, manual, ready, defaultCurrent, defaultPageSize, ...refreshDeps]);

  useEffect(() => {
    if (isRemote || staticDataSource === undefined) return;
    setDataSource(staticDataSource);
    setPagination((prev) => ({
      ...prev,
      total: staticDataSource.length,
    }));
  }, [isRemote, staticDataSource]);

  const selectedRows = useMemo(() => getSelectedRows(dataSource, selectedRowKeys, rowKey), [dataSource, rowKey, selectedRowKeys]);

  const mergedPagination = useMemo<TablePaginationConfig | false | undefined>(() => {
    if (paginationProp === false) return false;
    if (!isRemote) return paginationProp;

    const base: TablePaginationConfig = {
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
    };

    if (!paginationProp || typeof paginationProp !== 'object') {
      return base;
    }

    return {
      ...base,
      ...paginationProp,
      current: paginationProp.current ?? base.current,
      pageSize: paginationProp.pageSize ?? base.pageSize,
      total: paginationProp.total ?? base.total,
    };
  }, [isRemote, pagination, paginationProp]);

  const tableProps = useMemo(
    () => ({
      loading: isRemote ? loading : false,
      dataSource,
      pagination: mergedPagination,
      onChange: handleTableChange,
      rowKey,
      selectedRowKeys,
      onSelectionChange: handleSelectionChange,
      selectionType,
      paginationMode,
    }),
    [
      dataSource,
      handleSelectionChange,
      handleTableChange,
      isRemote,
      loading,
      mergedPagination,
      paginationMode,
      rowKey,
      selectedRowKeys,
      selectionType,
    ],
  );

  return {
    tableProps,
    loading,
    dataSource,
    pagination,
    filters,
    sorter,
    selectedRowKeys,
    selectedRows,
    refresh,
    reset,
    clearSelection,
    setDataSource,
    setPagination,
    run,
  };
}
