import { colorForBranch } from './gitTypes';

/**
 * Branch pointer rendered next to its commit. HEAD gets a thicker ring.
 */
export default function BranchLabel({ name, x, y, isHead, onClick, isDetached }) {
  const palette = colorForBranch(name);
  // Display the last segment after `/` to avoid overflow when names contain
  // a prefix (eg. `team-a/feature-a` → `feature-a`). Full name in tooltip.
  const display = name.includes('/') ? name.split('/').slice(-1)[0] : name;
  const w = 12 + display.length * 6;
  const h = 20;
  const labelX = x + 26; // to the right of the commit
  return (
    <g
      onClick={(e) => { e.stopPropagation(); onClick?.(name); }}
      className="cursor-pointer"
    >
      <title>{name}</title>
      {isHead && (
        <rect
          x={labelX - 3} y={y - h / 2 - 3}
          width={w + 6} height={h + 6}
          rx={12}
          fill="none" stroke="#0F172A" strokeWidth={2}
          strokeDasharray={isDetached ? '3 3' : undefined}
        />
      )}
      <rect
        x={labelX} y={y - h / 2}
        width={w} height={h}
        rx={9}
        fill={palette.color}
        stroke="none"
      />
      <text
        x={labelX + w / 2} y={y + 4}
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill={palette.color === '#FFC857' ? '#1E293B' : '#FFFFFF'}
        pointerEvents="none"
      >
        {display}
      </text>
    </g>
  );
}

/**
 * Standalone HEAD pill shown when HEAD is detached (pointing at a raw commit).
 */
export function HeadPill({ x, y }) {
  const w = 42;
  const h = 20;
  return (
    <g pointerEvents="none">
      <rect x={x + 26} y={y - h / 2} width={w} height={h} rx={9} fill="#0F172A" />
      <text x={x + 26 + w / 2} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#FFF">HEAD</text>
    </g>
  );
}
