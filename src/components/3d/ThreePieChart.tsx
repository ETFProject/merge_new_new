'use client';

import { useState, useMemo } from 'react';

interface SegmentData {
    category: string;
    percentage: number;
    color: string;
}

interface PieChartProps {
    data: SegmentData[];
    size?: number;
}

const PieChart = ({ data, size = 200 }: PieChartProps) => {
    const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);

    const segments = useMemo(() => {
        let cumulativePercentage = 0;
        return data.map(item => {
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = startAngle + (item.percentage / 100) * 360;
            cumulativePercentage += item.percentage;
            return { ...item, startAngle, endAngle };
        });
    }, [data]);

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                    {segments.map(segment => {
                        const [startX, startY] = getCoordinatesForPercent(segment.startAngle / 360);
                        const [endX, endY] = getCoordinatesForPercent(segment.endAngle / 360);
                        const largeArcFlag = (segment.endAngle - segment.startAngle) > 180 ? 1 : 0;

                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            'L 0 0',
                        ].join(' ');

                        const isHighlighted = highlightedCategory === segment.category || highlightedCategory === null;

                        return (
                            <path
                                key={segment.category}
                                d={pathData}
                                fill={segment.color}
                                onMouseEnter={() => setHighlightedCategory(segment.category)}
                                onMouseLeave={() => setHighlightedCategory(null)}
                                style={{
                                    transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
                                    opacity: isHighlighted ? 1 : 0.5,
                                    transform: highlightedCategory === segment.category ? 'scale(1.03)' : 'scale(1)',
                                    transformOrigin: 'center',
                                    cursor: 'pointer',
                                }}
                            />
                        );
                    })}
                </svg>
                {segments.map(segment => {
                     if (highlightedCategory === segment.category) {
                        return (
                           <div
                              key={`label-${segment.category}`}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none"
                           >
                              <div className="bg-gray-800/80 text-white text-lg font-bold px-3 py-1 rounded-md shadow-lg">
                                 {`${segment.category}: ${segment.percentage.toFixed(1)}%`}
                              </div>
                           </div>
                        )
                     }
                     return null;
                })}
            </div>
            <div className="ml-8 flex flex-col gap-2 min-w-[150px]">
                {data.map((item) => (
                    <div
                        key={item.category}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                            highlightedCategory === item.category ? 'bg-white/10' : 'bg-transparent'
                        }`}
                        onMouseEnter={() => setHighlightedCategory(item.category)}
                        onMouseLeave={() => setHighlightedCategory(null)}
                    >
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white/90">{item.category}</p>
                        </div>
                        <p className="text-sm font-bold text-white/90">{item.percentage.toFixed(1)}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface ThreePieChartProps {
    data: SegmentData[];
}

export function ThreePieChart({ data }: ThreePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-lg">
        <p className="text-white/70">No allocation data available.</p>
      </div>
    );
  }

  return <PieChart data={data} size={250} />;
} 