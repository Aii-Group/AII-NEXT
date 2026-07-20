import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Form, Input, Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Refresh } from '@icon-park/react';
import { useTranslation } from 'react-i18next';
import { AIISearch, type AIISearchItem } from '@/components/AIISearch';
import { AIITable } from '@/components/AIITable';
import { DemoUserForm } from '@/features/demo-users/DemoUserForm';
import {
  createDemoUser,
  deleteDemoUser,
  deleteDemoUsers,
  listDemoUsers,
  resetDemoUsers,
  updateDemoUser,
} from '@/features/demo-users/mock-api';
import type { DemoUser, DemoUserFormValues, DemoUserQuery, DemoUserStatus } from '@/features/demo-users/types';
import { useModal } from '@/hooks/use-modal';
import { useTable } from '@/hooks/use-table';
import { DateFormat, formatDateTime } from '@/utils/dayjs';

export const Route = createFileRoute('/_app/_authentication/demo/users')({
  component: DemoUsersPage,
});

const refreshIcon = <Refresh />;
const plusIcon = <Plus />;

function DemoUsersPage() {
  const { t } = useTranslation(['demo', 'common']);
  const modal = useModal();
  const [form] = Form.useForm<DemoUserFormValues>();
  const [query, setQuery] = useState<DemoUserQuery>({});

  const { tableProps, run, refresh, clearSelection, selectedRowKeys } = useTable(listDemoUsers, {
    rowKey: 'id',
    params: query,
    selectionType: 'checkbox',
  });

  const statusOptions = [
    { value: 'enabled' as const, label: t('Users.Enabled') },
    { value: 'disabled' as const, label: t('Users.Disabled') },
  ] satisfies { value: DemoUserStatus; label: string }[];

  const searchItems: AIISearchItem<DemoUserQuery>[] = [
    {
      name: 'name',
      children: (
        <Input
          allowClear
          placeholder={t('Users.Name_Placeholder')}
        />
      ),
    },
    {
      name: 'email',
      children: (
        <Input
          allowClear
          placeholder={t('Users.Email_Placeholder')}
        />
      ),
    },
    {
      name: 'status',
      children: (
        <Select
          allowClear
          placeholder={t('Users.Status_Placeholder')}
          options={statusOptions}
        />
      ),
    },
  ];

  const columns: ColumnsType<DemoUser> = [
    {
      title: t('Users.Name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: t('Users.Email'),
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: t('Users.Department'),
      dataIndex: 'department',
      key: 'department',
      width: 140,
    },
    {
      title: t('Users.Status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: DemoUserStatus) => (
        <Tag color={status === 'enabled' ? 'success' : 'default'}>{status === 'enabled' ? t('Users.Enabled') : t('Users.Disabled')}</Tag>
      ),
    },
    {
      title: t('Users.Created_At'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value, DateFormat.DateTimeMinute),
    },
  ];

  const openCreateModal = () => {
    modal.open({
      title: t('Users.Create_Title'),
      okText: t('common:Actions.Submit'),
      cancelText: t('common:Actions.Cancel'),
      destroyOnHidden: true,
      children: (
        <DemoUserForm
          key='create'
          form={form}
        />
      ),
      onOk: async () => {
        const values = await form.validateFields();
        await createDemoUser(values);
        window.$message.success(t('Users.Create_Success'));
        await run(query);
      },
    });
  };

  const openEditModal = (record: DemoUser) => {
    modal.open({
      title: t('Users.Edit_Title'),
      okText: t('common:Actions.Submit'),
      cancelText: t('common:Actions.Cancel'),
      destroyOnHidden: true,
      children: (
        <DemoUserForm
          key={record.id}
          form={form}
          initialValues={{
            name: record.name,
            email: record.email,
            department: record.department,
            status: record.status,
          }}
        />
      ),
      onOk: async () => {
        const values = await form.validateFields();
        await updateDemoUser(record.id, values);
        window.$message.success(t('Users.Update_Success'));
        await refresh();
      },
    });
  };

  const confirmDelete = (record: DemoUser) => {
    window.$modal.confirm({
      title: t('Users.Delete_Confirm_Title'),
      content: t('Users.Delete_Confirm_Content', { name: record.name }),
      okText: t('common:Actions.Delete'),
      cancelText: t('common:Actions.Cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteDemoUser(record.id);
        window.$message.success(t('Users.Delete_Success'));
        clearSelection();
        await refresh();
      },
    });
  };

  const confirmBatchDelete = () => {
    window.$modal.confirm({
      title: t('Users.Batch_Delete_Confirm_Title'),
      content: t('Users.Batch_Delete_Confirm_Content', { count: selectedRowKeys.length }),
      okText: t('common:Actions.Delete'),
      cancelText: t('common:Actions.Cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteDemoUsers(selectedRowKeys.map(String));
        window.$message.success(t('Users.Delete_Success'));
        clearSelection();
        await refresh();
      },
    });
  };

  const handleResetSeed = () => {
    window.$modal.confirm({
      title: t('Users.Reset_Confirm_Title'),
      content: t('Users.Reset_Confirm_Content'),
      okText: t('common:Actions.Confirm'),
      cancelText: t('common:Actions.Cancel'),
      onOk: async () => {
        await resetDemoUsers();
        clearSelection();
        setQuery({});
        window.$message.success(t('Users.Reset_Success'));
        await run({});
      },
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <h1 className='text-lg font-semibold text-foreground'>{t('Users.Page_Title')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('Users.Page_Description')}</p>
      </div>

      <AIISearch<DemoUserQuery>
        items={searchItems}
        onSearch={(values) => {
          setQuery(values);
          void run(values);
        }}
        onReset={() => {
          setQuery({});
          void run({});
        }}
      />

      <AIITable<DemoUser>
        {...tableProps}
        columns={columns}
        toolbar={{
          left: <span className='text-sm text-muted-foreground'>{t('Users.Toolbar_Hint')}</span>,
          actions: [
            {
              key: 'reset',
              label: t('Users.Reset_Seed'),
              icon: refreshIcon,
              onClick: handleResetSeed,
            },
            {
              key: 'create',
              label: t('common:Actions.Create'),
              icon: plusIcon,
              type: 'primary',
              permission: 'demo:user:create',
              onClick: openCreateModal,
            },
          ],
        }}
        batchActions={[
          {
            key: 'batch-delete',
            label: t('common:AII_Table.Batch_Delete'),
            danger: true,
            permission: 'demo:user:delete',
            disabled: (keys) => keys.length === 0,
            onClick: confirmBatchDelete,
          },
        ]}
        rowActions={[
          {
            key: 'edit',
            label: t('common:Actions.Edit'),
            permission: 'demo:user:edit',
            onClick: openEditModal,
          },
          {
            key: 'delete',
            label: t('common:Actions.Delete'),
            danger: true,
            permission: 'demo:user:delete',
            onClick: confirmDelete,
          },
        ]}
      />
    </div>
  );
}
