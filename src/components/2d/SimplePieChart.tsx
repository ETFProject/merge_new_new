'use client';

import { useState, useMemo } from 'react';

interface PieSegment {
  category: string;
  percentage: number;
  color: string;
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

  return (
    <g
      onMouseEnter={() => onHover(segment.category)}
      onMouseLeave={() => onHover(null)}
      style={{ transform: isHighlighted ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.2s ease-in-out', transformOrigin: 'center' }}
    >
      <path d={pathData} fill={segment.color} stroke="#020817" strokeWidth="2" />
    </g>
  );
};

export function SimplePieChart({ data }: SimplePieChartProps) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const radius = 100;

  let cumulativePercentage = 0;
  const segments = data.map(segment => {
    const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
    cumulativePercentage += segment.percentage;
    const endAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
    return { ...segment, startAngle, endAngle };
  });

  const highlightedSegment = data.find(s => s.category === highlightedCategory);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
      <div className="relative w-1/2">
        <svg viewBox="-120 -120 240 240" preserveAspectRatio="xMidYMid meet">
          <g>
            {segments.map((segment) => (
              <PieSlice
                key={segment.category}
                segment={segment}
                radius={radius}
                startAngle={segment.startAngle}
                endAngle={segment.endAngle}
                isHighlighted={highlightedCategory === segment.category}
                onHover={setHighlightedCategory}
              />
            ))}
          </g>
        </svg>
        {highlightedSegment && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-3xl font-bold text-white">{highlightedSegment.percentage}%</p>
                <p className="text-lg text-gray-300">{highlightedSegment.category}</p>
            </div>
        )}
      </div>
      <div className="w-1/2 pl-8 flex flex-col justify-center gap-2">
        {data.map(segment => (
          <div
            key={segment.category}
            className={`flex items-center p-2 rounded-md transition-all ${highlightedCategory === segment.category ? 'bg-slate-700' : ''}`}
            onMouseEnter={() => setHighlightedCategory(segment.category)}
            onMouseLeave={() => setHighlightedCategory(null)}
          >
            <div style={{ backgroundColor: segment.color }} className="w-4 h-4 rounded-sm mr-3" />
            <span className="text-white text-sm font-medium flex-1">{segment.category}</span>
            <span className="text-gray-300 text-sm">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 