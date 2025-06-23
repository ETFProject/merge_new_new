'use client';

import { useState } from 'react';

const CORPORATE_COLORS = ['#0062FF', '#14A38B', '#FF9500', '#5856D6', '#FF3B30', '#8E8E93'];

interface PieSegment {
  category: string;
  percentage: number;
  color: string;
  index: number;
}

interface SimplePieChartProps {
  data: PieSegment[];
}

interface PieSliceProps {
  segment: PieSegment;
  radius: number;
  startAngle: number;
  endAngle: number;
  isHighlighted: boolean;
  onHover: (category: string | null) => void;
}

const PieSlice = ({ segment, radius, startAngle, endAngle, isHighlighted, onHover }: PieSliceProps) => {
  const x1 = radius * Math.cos(startAngle);
  const y1 = radius * Math.sin(startAngle);
  const x2 = radius * Math.cos(endAngle);
  const y2 = radius * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L 0 0`;
  const color = CORPORATE_COLORS[segment.index % CORPORATE_COLORS.length];

  return (
    <g
      onMouseEnter={() => onHover(segment.category)}
      onMouseLeave={() => onHover(null)}
      style={{
        transform: isHighlighted ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.2s ease-in-out',
        transformOrigin: 'center',
        filter: isHighlighted ? `drop-shadow(0 0 8px ${color})` : 'none'
      }}
    >
      <path d={pathData} fill={color} strokeWidth="2" />
    </g>
  );
};

export function SimplePieChart({ data }: SimplePieChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const radius = 100;

  let cumulativePercentage = 0;
  const segments = data.map((segment, index) => {
    const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
    cumulativePercentage += segment.percentage;
    const endAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
    return { ...segment, startAngle, endAngle, index };
  });

  const highlightedSegment = data.find(s => s.category === highlightedCategory);

  return (
    <div className="w-full h-full flex items-center justify-between p-4 bg-white rounded-lg">
      <div className="relative w-1/2 h-full flex items-center justify-center">
        <svg viewBox="-120 -120 240 240" preserveAspectRatio="xMidYMid meet">
            {segments.map((segment) => (
              <PieSlice
                key={segment.category}
                segment={segment}
                radius={radius}
                startAngle={segment.startAngle}
                endAngle={segment.endAngle}
                isHighlighted={highlightedCategory === segment.category || highlightedCategory === null}
                onHover={setHighlightedCategory}
              />
            ))}
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-3xl font-bold text-gray-800">
              {highlightedSegment ? `${highlightedSegment.percentage}%` : 'Assets'}
            </p>
            {highlightedSegment && <p className="text-lg text-gray-600">{highlightedSegment.category}</p>}
        </div>
      </div>
      <div className="w-1/2 pl-8 flex flex-col justify-center gap-2">
        {data.map((segment, index) => (
          <div
            key={segment.category}
            className={`flex items-center p-2 rounded-md transition-all cursor-pointer ${highlightedCategory === segment.category ? 'bg-gray-100' : ''}`}
            onMouseEnter={() => setHighlightedCategory(segment.category)}
            onMouseLeave={() => setHighlightedCategory(null)}
          >
            <div style={{ backgroundColor: CORPORATE_COLORS[index % CORPORATE_COLORS.length] }} className="w-3 h-3 rounded-sm mr-3" />
            <span className="text-gray-800 text-sm font-medium flex-1">{segment.category}</span>
            <span className="text-gray-600 text-sm">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 