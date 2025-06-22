'use client';

import { useState } from 'react';

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
}

const DistributionBar = ({ item, isHighlighted, onHover }: DistributionBarProps) => {
  return (
    <div
      className="w-full"
      onMouseEnter={() => onHover(item.category)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-white">{item.category}</span>
        <span className="text-sm font-bold text-white">{item.percentage}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3">
        <div
          style={{
            width: `${item.percentage}%`,
            backgroundColor: item.color,
            transition: 'width 0.5s ease-in-out, filter 0.2s',
            filter: isHighlighted ? 'brightness(1.2)' : 'brightness(1)',
          }}
          className="h-3 rounded-full"
        />
      </div>
    </div>
  );
};

export function SimpleDistributionChart({ data }: SimpleDistributionChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

  return (
    <div className="w-full h-full flex flex-col justify-center p-6 bg-transparent">
        <h3 className="text-lg font-semibold text-white mb-4">Chain Distribution</h3>
        <div className="space-y-4">
            {data.map((item) => (
                <DistributionBar
                key={item.category}
                item={item}
                isHighlighted={highlightedCategory === item.category}
                onHover={setHighlightedCategory}
                />
            ))}
        </div>
    </div>
  );
} 