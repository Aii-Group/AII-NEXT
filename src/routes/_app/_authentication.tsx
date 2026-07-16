import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireAuthToken } from '@/utils/auth-guard';

export const Route = createFileRoute('/_app/_authentication')({
  beforeLoad: () => requireAuthToken(),
  component: () => <Outlet />,
});
