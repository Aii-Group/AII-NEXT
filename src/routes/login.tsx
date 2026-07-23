import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Checkbox, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import Logo from '@/assets/asiainfo-logo.png';
import { LocaleButton, ThemeToggleButton } from '@/layout/component';
import { usePreferenceStore } from '@/store/preference/store';
import { useUserStore } from '@/store/user/store';

export const Route = createFileRoute('/login')({
  component: RouteComponent,
});

interface LoginFormValues {
  username: string;
  password: string;
  captcha: string;
  remember?: boolean;
}

function RouteComponent() {
  const { t } = useTranslation('common');
  const locale = usePreferenceStore((state) => state.locale);
  const navigate = useNavigate();

  const appName = (locale === 'en-US' ? import.meta.env.VITE_APP_NAME_EN : import.meta.env.VITE_APP_NAME_ZH)?.trim() || 'ASIAINFO';

  const handleSubmit = (values: LoginFormValues) => {
    // 独立环境无 Keycloak 时写入内存态 token，供 requireAuthToken 放行
    useUserStore.getState().setUser({
      userName: values.username,
      userIdStr: values.username,
      token: crypto.randomUUID(),
    });
    void navigate({ to: '/' });
  };

  return (
    <div className='grid min-h-screen grid-rows-[84px_minmax(0,1fr)_64px] bg-[#fcfcf9] text-[#0b0b0b] max-sm:grid-rows-[56px_minmax(0,1fr)_auto] dark:bg-[#101114] dark:text-[#f4f5f7] [@supports(height:100svh)]:min-h-svh'>
      <header className='relative z-1 bg-[#fcfcf9] dark:border-white/10 dark:bg-[#101114]'>
        <div className='mx-auto flex h-full w-[min(calc(100%-48px),90rem)] items-center justify-between gap-6 max-sm:w-[calc(100%-32px)]'>
          <div className='flex min-w-0 items-center gap-2 text-xl leading-none font-semibold text-[#0b0b0b] dark:text-[#f4f5f7]'>
            <img
              src={Logo}
              alt=''
              aria-hidden
              width={40}
              height={40}
              fetchPriority='high'
              decoding='async'
              className='size-10 shrink-0 object-contain'
            />
            <span className='truncate text-2xl'>{appName}</span>
          </div>

          <nav
            className='flex shrink-0 items-center gap-0.5'
            aria-label={t('Login.Preferences')}
          >
            <LocaleButton />
            <ThemeToggleButton />
          </nav>
        </div>
      </header>

      <main className='grid min-h-0 place-items-center bg-[#fcfcf9] bg-[radial-gradient(circle_at_center,rgba(252,252,249,0.9)_0,rgba(252,252,249,0.9)_14%,transparent_44%),radial-gradient(circle,rgba(11,11,11,0.14)_0.75px,transparent_0.9px)] bg-size-[100%_100%,16px_16px] bg-position-[center,center] [background-repeat:no-repeat,repeat] px-6 pt-10 pb-14 max-sm:items-start max-sm:px-5 max-sm:pt-14 max-sm:pb-10 dark:bg-[#101114] dark:bg-[radial-gradient(circle_at_center,rgba(16,17,20,0.84)_0,rgba(16,17,20,0.84)_14%,transparent_44%),radial-gradient(circle,rgba(255,255,255,0.1)_0.75px,transparent_0.9px)] [@media(max-height:640px)_and_(min-width:641px)]:items-start [@media(max-height:640px)_and_(min-width:641px)]:py-8'>
        <section
          className='w-full max-w-md'
          aria-labelledby='login-title'
        >
          <div className='mb-8 text-center'>
            <h1
              id='login-title'
              className='m-0 text-4xl leading-10 font-bold tracking-normal text-[#0b0b0b] max-sm:text-[30px] max-sm:leading-9 dark:text-[#f4f5f7]'
            >
              {t('Login.Title')}
            </h1>
            <p className='mx-auto mt-2.5 mb-0 max-w-105 text-sm leading-5.25 text-[#66645f] dark:text-[#9da1aa]'>
              {t('Login.Description')}
            </p>
          </div>

          <Form<LoginFormValues>
            layout='vertical'
            colon={false}
            requiredMark={false}
            size='large'
            className='rounded-4xl border border-black/10 bg-[#fcfcf9]/96 p-7! shadow-[0_4px_24px_rgba(11,11,11,0.03),0_4px_32px_rgba(11,11,11,0.02)] backdrop-blur-xl max-sm:p-6 dark:border-white/10 dark:bg-[#181a1e]/96 dark:shadow-[0_16px_40px_rgba(0,0,0,0.22)] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none'
            initialValues={{ remember: true }}
            scrollToFirstError
            onFinish={handleSubmit}
          >
            <Form.Item
              name='username'
              label={t('Login.Username_Label')}
              rules={[{ required: true }]}
              className='mb-3!'
            >
              <Input
                autoComplete='username'
                placeholder={t('Login.Username_Placeholder')}
              />
            </Form.Item>

            <Form.Item
              name='password'
              label={t('Fields.Password')}
              rules={[{ required: true }]}
              className='mb-3!'
            >
              <Input.Password
                autoComplete='current-password'
                placeholder={t('Login.Password_Placeholder')}
              />
            </Form.Item>

            <Form.Item
              label={t('Login.Captcha_Label')}
              required
              className='mb-3!'
            >
              <div className='flex gap-3'>
                <Form.Item
                  name='captcha'
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input
                    autoComplete='off'
                    placeholder={t('Login.Captcha_Placeholder')}
                  />
                </Form.Item>
                <button
                  type='button'
                  aria-label={t('Login.Captcha_Refresh')}
                  className='m-0 w-28 shrink-0 cursor-pointer self-stretch overflow-hidden rounded-lg border border-black/10 bg-[#eceae4] p-0 dark:border-white/10 dark:bg-[#2a2d33]'
                >
                  <span className='flex size-full items-center justify-center text-xs text-[#66645f] dark:text-[#9da1aa]'>
                    {t('Login.Captcha_Image')}
                  </span>
                </button>
              </div>
            </Form.Item>

            <Form.Item
              name='remember'
              valuePropName='checked'
              className='mb-3!'
            >
              <Checkbox>{t('Login.Remember_Me')}</Checkbox>
            </Form.Item>

            <Form.Item className='mb-0!'>
              <Button
                type='primary'
                htmlType='submit'
                size='large'
                block
              >
                {t('Login.Continue')}
              </Button>
            </Form.Item>
          </Form>
        </section>
      </main>

      <footer className='relative z-1 flex items-center justify-center bg-[#fcfcf9] px-6 py-4 text-center text-xs text-[#66645f] max-sm:min-h-14 dark:bg-[#101114] dark:text-[#9da1aa]'>
        {t('Login.Copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
