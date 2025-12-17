'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  readonly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          className={`${sizeClasses[size]} transition-all ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${
            star <= displayValue
              ? 'text-yellow-400'
              : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
      {!readonly && (
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value} star${value !== 1 ? 's' : ''}` : 'Select rating'}
        </span>
      )}
    </div>
  );
}
