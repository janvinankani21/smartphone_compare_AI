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
    if (val >= 85) return { stroke: '#10b981', text: 'text-better', bg: 'bg-better/10' }; // green
    if (val >= 70) return { stroke: '#f59e0b', text: 'text-similar', bg: 'bg-similar/10' }; // yellow
    return { stroke: '#f43f5e', text: 'text-worse', bg: 'bg-worse/10' }; // red
  };

  const colors = getColor(score);
  
  if (type === 'bar') {
    return (
      <div className="w-full text-left">
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          <span className="text-muted-foreground">{label}</span>
          <span className={colors.text}>{score}/100</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden">
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
            stroke="#27272a"
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
        <span className={`absolute inset-0 flex items-center justify-center font-bold font-mono text-white ${dim.fontSize}`}>
          {score}
        </span>
      </div>
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
};
