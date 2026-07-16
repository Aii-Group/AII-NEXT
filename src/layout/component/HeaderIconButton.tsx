import type { MouseEvent, ReactNode } from 'react';
import { Button, Tooltip } from 'antd';

interface HeaderIconButtonProps {
  label: string;
  icon: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export function HeaderIconButton({ label, icon, onClick }: HeaderIconButtonProps) {
  return (
    <Tooltip title={label}>
      <Button
        type='text'
        aria-label={label}
        icon={icon}
        onClick={onClick}
      />
    </Tooltip>
  );
}
