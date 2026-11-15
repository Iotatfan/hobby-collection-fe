import { BoxIcon, Star, Package } from 'lucide-react';
import type { ShelfCategory } from '@/libs/collection/collection';

export const categories = {
  gunpla: { key: 'gunpla_shelf', name: 'Gunpla', icon: BoxIcon, accent: '#5B6CF6' },
  figure: { key: 'figure_shelf', name: 'Figure', icon: Star, accent: '#805AD5' },
  'other-model-kit': {
    key: 'other_model_kit_shelf',
    name: 'Other Model Kit',
    icon: Package,
    accent: '#38A169',
  },
} as const;
export const isCategory = (value: string | undefined): value is ShelfCategory =>
  Boolean(value && Object.hasOwn(categories, value));
export const shelfBackground =
  'radial-gradient(circle at 15% 20%, rgba(30,64,175,.24), transparent 28%), linear-gradient(180deg, #0a192f, #020c1b)';
