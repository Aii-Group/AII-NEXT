import { createFileRoute } from '@tanstack/react-router';
import { DefaultForbidden } from '../../-DefaultForbidden';

export const Route = createFileRoute('/_app/_system/403')({
  component: DefaultForbidden,
});
