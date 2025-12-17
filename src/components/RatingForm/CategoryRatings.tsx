'use client';

import { CategoryRatings as CategoryRatingsType } from '@/types';
import StarRating from './StarRating';

interface CategoryRatingsProps {
  categories: CategoryRatingsType;
  onChange: (category: keyof CategoryRatingsType, value: number) => void;
  readonly?: boolean;
}

const categoryLabels: Record<keyof CategoryRatingsType, { label: string; emoji: string }> = {
  safety: { label: 'Safety', emoji: '🛡️' },
  vibe: { label: 'Vibe & Energy', emoji: '✨' },
  transit: { label: 'Transit & Parking', emoji: '🚇' },
  food: { label: 'Food & Dining', emoji: '🍽️' },
  nightlife: { label: 'Nightlife', emoji: '🌙' },
  value: { label: 'Value', emoji: '💰' },
};

export default function CategoryRatings({
  categories,
  onChange,
  readonly = false,
}: CategoryRatingsProps) {
  return (
    <div className="space-y-4">
      {(Object.keys(categoryLabels) as Array<keyof CategoryRatingsType>).map((key) => (
        <div key={key} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryLabels[key].emoji}</span>
            <span className="font-medium text-gray-700">{categoryLabels[key].label}</span>
          </div>
          <StarRating
            value={categories[key]}
            onChange={(value) => onChange(key, value)}
            size="sm"
            readonly={readonly}
          />
        </div>
      ))}
    </div>
  );
}
