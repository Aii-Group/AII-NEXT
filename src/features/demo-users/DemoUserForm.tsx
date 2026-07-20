import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useTranslation } from 'react-i18next';
import type { DemoUserFormValues, DemoUserStatus } from './types';

export interface DemoUserFormProps {
  form: FormInstance<DemoUserFormValues>;
  initialValues?: Partial<DemoUserFormValues>;
}

const STATUS_OPTIONS: { value: DemoUserStatus; labelKey: 'Enabled' | 'Disabled' }[] = [
  { value: 'enabled', labelKey: 'Enabled' },
  { value: 'disabled', labelKey: 'Disabled' },
];

/** 示例用户新建 / 编辑表单字段 */
export function DemoUserForm({ form, initialValues }: DemoUserFormProps) {
  const { t } = useTranslation('demo');

  return (
    <Form
      form={form}
      layout='vertical'
      preserve={false}
      initialValues={{
        status: 'enabled',
        ...initialValues,
      }}
    >
      <Form.Item
        name='name'
        label={t('Users.Name')}
        rules={[{ required: true, message: t('Users.Name_Required') }]}
      >
        <Input
          allowClear
          maxLength={40}
          placeholder={t('Users.Name_Placeholder')}
        />
      </Form.Item>

      <Form.Item
        name='email'
        label={t('Users.Email')}
        rules={[
          { required: true, message: t('Users.Email_Required') },
          { type: 'email', message: t('Users.Email_Invalid') },
        ]}
      >
        <Input
          allowClear
          placeholder={t('Users.Email_Placeholder')}
        />
      </Form.Item>

      <Form.Item
        name='department'
        label={t('Users.Department')}
        rules={[{ required: true, message: t('Users.Department_Required') }]}
      >
        <Input
          allowClear
          maxLength={40}
          placeholder={t('Users.Department_Placeholder')}
        />
      </Form.Item>

      <Form.Item
        name='status'
        label={t('Users.Status')}
        rules={[{ required: true, message: t('Users.Status_Required') }]}
      >
        <Select
          options={STATUS_OPTIONS.map((item) => ({
            value: item.value,
            label: t(`Users.${item.labelKey}`),
          }))}
        />
      </Form.Item>
    </Form>
  );
}
