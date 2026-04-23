import { colorForBranch } from './gitTypes';

export default function CommitNode({ commit, x, y, branchName, isHead, isSelected, onClick }) {
  const palette = colorForBranch(branchName || 'main');
  const r = 18;
  const isMerge = commit.parents.length >= 2;

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onClick?.(commit.sha); }}
      className="cursor-pointer"
    >
      {isSelected && (
        <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#6366F1" strokeWidth={2.5} />
      )}
      <circle
        cx={x} cy={y} r={r}
        fill={isMerge ? '#FFFFFF' : palette.light}
        stroke={palette.color}
        strokeWidth={isHead ? 3.5 : 2.5}
      />
      <text
        x={x} y={y + 3}
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill={palette.color}
        pointerEvents="none"
      >
        {commit.sha.slice(0, 4)}
      </text>
      <title>{`${commit.sha} · ${commit.message}`}</title>
    </g>
  );
}
