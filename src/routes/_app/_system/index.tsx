import { createFileRoute } from '@tanstack/react-router';
import Logo from '@/assets/asiainfo-logo.png';

export const Route = createFileRoute('/_app/_system/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className='flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center'>
      <img
        src={Logo}
        alt=''
        aria-hidden
        className='pointer-events-none max-h-[min(40dvh,320px)] w-auto max-w-[min(60%,480px)] opacity-[0.08] select-none dark:opacity-[0.06]'
      />
    </div>
  );
}
