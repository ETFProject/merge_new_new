import React from 'react';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: [number];
  onValueChange: (value: [number]) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ min = 0, max = 1, step = 0.01, value, onValueChange, className }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={e => onValueChange([parseFloat(e.target.value)])}
      className={`w-full accent-blue-500 h-2 rounded-lg appearance-none bg-gray-300 ${className || ''}`}
      style={{ cursor: 'pointer' }}
    />
  );
}; 