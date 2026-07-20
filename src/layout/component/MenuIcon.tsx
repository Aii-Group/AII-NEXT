import type { Icon } from '@icon-park/react/lib/runtime';
import { BookOpen, People } from '@icon-park/react';

const MENU_ICON_MAP: Record<string, Icon> = {
  'book-open': BookOpen,
  people: People,
};

interface MenuIconProps {
  name: string;
}

export function MenuIcon({ name }: MenuIconProps) {
  const Icon = MENU_ICON_MAP[name];
  if (!Icon) return null;
  return (
    <span className='inline-flex items-center justify-center px-1'>
      <Icon />
    </span>
  );
}
