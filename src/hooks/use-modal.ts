import { useContext } from 'react';
import { ModalContext } from '@/contexts/modal-context';

export function useModal() {
  const modal = useContext(ModalContext);

  if (!modal) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return modal;
}
