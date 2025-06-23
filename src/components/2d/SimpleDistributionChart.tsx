'use client';

import { useState } from 'react';

const CORPORATE_COLORS = ['#0062FF', '#14A38B', '#FF9500', '#5856D6', '#FF3B30', '#8E8E93'];

interface DistributionDataItem {
  category: string;
  percentage: number;
  color: string;
}

interface SimpleDistributionChartProps {
  data: DistributionDataItem[];
}

interface DistributionBarProps {
    item: DistributionDataItem;
    isHighlighted: boolean;
    onHover: (category: string | null) => void;
    color: string;
}

const DistributionBar = ({ item, isHighlighted, onHover, color }: DistributionBarProps) => {
  return (
    <div
      className="w-full cursor-pointer"
      onMouseEnter={() => onHover(item.category)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-800">{item.category}</span>
        <span className="text-sm font-bold text-gray-800">{item.percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          style={{
            width: `${item.percentage}%`,
            backgroundColor: color,
            transition: 'width 0.5s ease-in-out, filter 0.2s',
            filter: isHighlighted ? 'brightness(1.1)' : 'brightness(1)',
          }}
          className="h-2.5 rounded-full"
        />
      </div>
    </div>
  );
};

export function SimpleDistributionChart({ data }: SimpleDistributionChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 bg-white rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chain Distribution</h3>
        <div className="space-y-4">
            {data.map((item, index) => (
                <DistributionBar
                key={item.category}
                item={item}
                isHighlighted={highlightedCategory === item.category}
                onHover={setHighlightedCategory}
                color={CORPORATE_COLORS[index % CORPORATE_COLORS.length]}
                />
            ))}
        </div>
    </div>
  );
} 