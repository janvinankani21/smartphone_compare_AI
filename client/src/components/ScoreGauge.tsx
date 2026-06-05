import React from 'react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'circle' | 'bar';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label, size = 'md', type = 'circle' }) => {
  // Determine color theme based on score value
  const getColor = (val: number) => {
    if (val >= 85) return { stroke: '#22C55E', text: 'text-emerald-600', bg: 'bg-emerald-50' }; // green
    if (val >= 70) return { stroke: '#FFB300', text: 'text-amber-600', bg: 'bg-amber-50' }; // yellow
    return { stroke: '#EF4444', text: 'text-red-600', bg: 'bg-red-50' }; // red
  };

  const colors = getColor(score);
  
  if (type === 'bar') {
    return (
      <div className="w-full text-left">
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          <span className="text-muted-foreground">{label}</span>
          <span className={colors.text}>{score}/100</span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000`}
            style={{ width: `${score}%`, backgroundColor: colors.stroke }}
          />
        </div>
      </div>
    );
  }

  // Dimensions for circles
  const dimensions = {
    sm: { radius: 18, strokeWidth: 3, sizePx: 44, fontSize: 'text-[10px]' },
    md: { radius: 30, strokeWidth: 5, sizePx: 72, fontSize: 'text-sm' },
    lg: { radius: 46, strokeWidth: 7, sizePx: 110, fontSize: 'text-2xl' }
  };

  const dim = dimensions[size];
  const circumference = 2 * Math.PI * dim.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="relative" style={{ width: dim.sizePx, height: dim.sizePx }}>
        <svg className="h-full w-full -rotate-90">
          {/* Background circle */}
          <circle
            cx={dim.sizePx / 2}
            cy={dim.sizePx / 2}
            r={dim.radius}
            fill="transparent"
            stroke="#EAEAEA"
            strokeWidth={dim.strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={dim.sizePx / 2}
            cy={dim.sizePx / 2}
            r={dim.radius}
            fill="transparent"
            stroke={colors.stroke}
            strokeWidth={dim.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold font-mono text-foreground ${dim.fontSize}`}>
          {score}
        </span>
      </div>
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
};
