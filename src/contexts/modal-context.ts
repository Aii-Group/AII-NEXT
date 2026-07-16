import { createContext } from 'react';
import type { ModalAPI } from '@/types/modal';

export const ModalContext = createContext<ModalAPI | null>(null);
