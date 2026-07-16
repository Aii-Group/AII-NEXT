import { createFileRoute } from '@tanstack/react-router';
import { DefaultNotFound } from '../../-DefaultNotFound';

export const Route = createFileRoute('/_app/_system/$')({
  component: DefaultNotFound,
});
