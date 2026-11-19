import { BoxIcon, Star, Package } from 'lucide-react';
import type { ShelfCategory } from '@/libs/collection/collection';

export const categories = {
  gunpla: { key: 'gunpla_shelf', name: 'Gunpla', icon: BoxIcon, accent: '#5B6CF6' },
  figure: { key: 'figure_shelf', name: 'Figures', icon: Star, accent: '#805AD5' },
  'other-model-kit': {
    key: 'other_model_kit_shelf',
    name: 'Other Model Kits',
    icon: Package,
    accent: '#38A169',
  },
} as const;
export const isCategory = (value: string | undefined): value is ShelfCategory =>
  Boolean(value && Object.hasOwn(categories, value));
export const shelfBackground =
  'radial-gradient(circle at 15% 20%, rgba(30,64,175,.24), transparent 28%), linear-gradient(180deg, #0a192f, #020c1b)';

export const shelfColumns = { base: 2, md: 3, lg: 4, xl: 6 };
export const shelfCaptionHeight = '104px';

export function typeCategory(type?: string): ShelfCategory | undefined {
  switch (type?.trim().toLowerCase()) {
    case 'gunpla':
      return 'gunpla';
    case 'figure':
    case 'figures':
      return 'figure';
    case 'other model kit':
    case 'other model kits':
      return 'other-model-kit';
    default:
      return undefined;
  }
}
