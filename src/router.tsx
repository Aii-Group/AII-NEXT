import { createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { DefaultCatchBoundary } from '@/routes/-DefaultCatchBoundary';
import { DefaultNotFound } from '@/routes/-DefaultNotFound';
import { getMicroAppBaseRoute, isMicroAppEnvironment } from '@/utils/micro';

export const router = createRouter({
  routeTree,
  basepath: isMicroAppEnvironment() ? getMicroAppBaseRoute() : import.meta.env.BASE_URL,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultCatchBoundary,
  defaultNotFoundComponent: DefaultNotFound,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
