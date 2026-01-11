
import React from 'react';

interface ScoreInputProps {
  label: string;
  description: string;
  value: number;
  onChange: (val: number) => void;
  color: string;
  max?: number;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ label, description, value, onChange, color, max = 100 }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 transition-all hover:border-indigo-300 group shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{label}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{description}</p>
        </div>
        <span className={`text-lg font-black ${color}`}>{value}</span>
      </div>
      <input 
        type="range"
        min="0"
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between mt-1 text-[9px] text-slate-400 font-medium">
        <span>0 (낮음)</span>
        <span>{Math.floor(max / 2)}</span>
        <span>{max} (높음)</span>
      </div>
    </div>
  );
};

export default ScoreInput;
