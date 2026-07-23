import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { DefaultCatchBoundary } from './-DefaultCatchBoundary';
import { DefaultNotFound } from './-DefaultNotFound';
import { requireAuthToken } from '@/utils/auth-guard';

export const Route = createRootRoute({
  beforeLoad: ({ location }) => requireAuthToken(location.pathname),
  component: RootLayout,
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: DefaultNotFound,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position='bottom-right' />}
    </>
  );
}
