'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  reviewCount?: number;
  showDistribution?: boolean;
}

const defaultDistribution = [
  { stars: 5, count: 45, percentage: 60 },
  { stars: 4, count: 20, percentage: 27 },
  { stars: 3, count: 7, percentage: 9 },
  { stars: 2, count: 2, percentage: 3 },
  { stars: 1, count: 1, percentage: 1 },
];

export default function StarRating({ rating = 4.0, reviewCount = 75, showDistribution = false }: StarRatingProps) {
  return (
    <div className="space-y-3">
      {/* Rating Display */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={14}
              className={i <= Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
        <span className="text-xs text-gray-500">({reviewCount} resenas)</span>
      </div>

      {/* Distribution Bar Chart */}
      {showDistribution && (
        <div className="space-y-1.5">
          {defaultDistribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3">{item.stars}</span>
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
