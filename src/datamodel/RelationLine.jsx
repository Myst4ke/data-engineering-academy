/**
 * A cubic Bézier line between two column ports, with small 1/N labels at each end.
 */
export default function RelationLine({ from, to, cardinality, isSelected, isTemp, onClick }) {
  if (!from || !to) return null;
  const dx = to.x - from.x;
  const bow = Math.max(40, Math.abs(dx) * 0.4);
  const path = `M ${from.x} ${from.y} C ${from.x + bow} ${from.y}, ${to.x - bow} ${to.y}, ${to.x} ${to.y}`;
  const stroke = isTemp ? '#94A3B8' : isSelected ? '#6366F1' : '#64748B';
  const width = isSelected ? 2.8 : 2;
  const parts = (cardinality || '').split('-');
  const labelFrom = parts[0] || '';
  const labelTo   = parts[1] || '';
  const labelColor = '#475569';

  return (
    <g className={onClick ? 'cursor-pointer' : ''} onClick={onClick}>
      {/* invisible fat hit area for easier clicks */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={width} strokeDasharray={isTemp ? '5 4' : undefined} />
      {!isTemp && (
        <>
          <circle cx={from.x} cy={from.y} r={3.5} fill={stroke} />
          <circle cx={to.x} cy={to.y} r={3.5} fill={stroke} />
          {labelFrom && (
            <text x={from.x + 8} y={from.y - 8} fontSize="11" fontWeight="bold" fill={labelColor}>
              {labelFrom}
            </text>
          )}
          {labelTo && (
            <text x={to.x - 8} y={to.y - 8} fontSize="11" fontWeight="bold" fill={labelColor} textAnchor="end">
              {labelTo}
            </text>
          )}
        </>
      )}
    </g>
  );
}
