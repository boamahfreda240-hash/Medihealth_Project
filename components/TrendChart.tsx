import React from 'react';

interface Point { date: string; count: number }

const TrendChart: React.FC<{ data: Point[] }> = ({ data }) => {
  const width = 640;
  const height = 140;
  const padding = 30;
  const max = Math.max(...data.map(d => d.count), 1);

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - d.count / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="py-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* area fill */}
        <polygon points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`} fill="url(#g1)" opacity={0.9} />
        {/* x labels */}
        {data.map((d, i) => {
          const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
          return (
            <text key={d.date} x={x} y={height - 6} fontSize={10} fill="#475569" textAnchor="middle">{d.date.slice(5)}</text>
          );
        })}
      </svg>
    </div>
  );
};

export default TrendChart;
