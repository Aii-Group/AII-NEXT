import { FloatButton } from 'antd';
import { ToTop } from '@icon-park/react';

const backTopStyle = { bottom: 100 };

interface BackTopButtonProps {
  target: () => HTMLElement;
}

export function BackTopButton({ target }: BackTopButtonProps) {
  return (
    <FloatButton.BackTop
      shape='square'
      visibilityHeight={100}
      icon={<ToTop />}
      style={backTopStyle}
      target={target}
    />
  );
}
