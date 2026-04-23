import { DojoEmojiAuto } from '../components/DojoEmoji';
import { TABLE_TYPES } from './datamodelTypes';

export const TABLE_W       = 240;
export const TABLE_HEADER  = 40;
export const TABLE_ROW     = 28;
export const TABLE_ADD_H   = 30;
export const PORT_R        = 6;

export function getTableHeight(table) {
  const n = (table.columns || []).length;
  return TABLE_HEADER + n * TABLE_ROW + TABLE_ADD_H;
}

export function getColumnPortPos(table, columnId, side = 'right') {
  const idx = table.columns.findIndex(c => c.id === columnId);
  if (idx < 0) return { x: table.x, y: table.y };
  const y = table.y + TABLE_HEADER + idx * TABLE_ROW + TABLE_ROW / 2;
  const x = side === 'right' ? table.x + TABLE_W : table.x;
  return { x, y };
}

export default function TableNode({
  table,
  isSelected,
  connectingFrom,
  fkColumnIds,
  onMouseDown,
  onHeaderContextMenu,
  onColumnContextMenu,
  onPortMouseDown,
  onPortMouseUp,
  onAddColumn,
}) {
  const typeDef = TABLE_TYPES[table.type] || TABLE_TYPES.base;
  const height = getTableHeight(table);
  const isHeaderLight = typeDef.color === '#FFC857';

  return (
    <g>
      {isSelected && (
        <rect
          x={table.x - 4} y={table.y - 4}
          width={TABLE_W + 8} height={height + 8}
          rx={14}
          fill="none" stroke="#6366F1" strokeWidth={2.5}
          pointerEvents="none"
        />
      )}

      <foreignObject x={table.x} y={table.y} width={TABLE_W} height={height}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, table.id); }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onHeaderContextMenu(e, table.id); }}
          className="w-full h-full rounded-xl border-2 bg-white select-none cursor-grab active:cursor-grabbing overflow-hidden"
          style={{ borderColor: typeDef.color }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-1.5 px-2.5"
            style={{ background: typeDef.color, height: TABLE_HEADER, color: isHeaderLight ? '#1E293B' : 'white' }}
          >
            <DojoEmojiAuto native={typeDef.icon} size={16} />
            <span className="text-sm font-bold truncate flex-1">{table.name || 'Table'}</span>
            <span className="text-[9px] uppercase tracking-wide opacity-80">{typeDef.name}</span>
          </div>

          {/* Columns */}
          <div>
            {(table.columns || []).map((col) => {
              const isFk = fkColumnIds?.has(col.id);
              return (
                <div
                  key={col.id}
                  onMouseDown={(e) => e.stopPropagation()}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onColumnContextMenu(e, table.id, col.id); }}
                  className="flex items-center gap-1.5 px-2.5 border-t border-slate-100 text-[11px] hover:bg-slate-50 cursor-pointer"
                  style={{ height: TABLE_ROW }}
                  title="Clic droit : modifier"
                >
                  <span className="w-4 text-center">
                    {col.pk ? <span title="Clé primaire">🔑</span> : isFk ? <span title="Clé étrangère">🔗</span> : <span className="opacity-0">·</span>}
                  </span>
                  <span className="font-medium text-slate-700 truncate flex-1">{col.name || '(sans nom)'}</span>
                  <span className="text-[9px] text-slate-400 uppercase">{col.type || ''}</span>
                  {col.unique && !col.pk && <span className="text-[9px] text-indigo-500 font-bold" title="Unique">U</span>}
                  {col.notNull && !col.pk && <span className="text-[9px] text-slate-500 font-bold" title="NOT NULL">!</span>}
                </div>
              );
            })}

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAddColumn(table.id); }}
              className="w-full text-left text-[10px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 border-t border-slate-100"
              style={{ height: TABLE_ADD_H, lineHeight: `${TABLE_ADD_H}px` }}
            >
              + colonne
            </button>
          </div>
        </div>
      </foreignObject>

      {/* Ports : left + right of each column row, rendered on top of foreignObject */}
      {(table.columns || []).map((col, idx) => {
        const cy = table.y + TABLE_HEADER + idx * TABLE_ROW + TABLE_ROW / 2;
        const activeRight = connectingFrom?.tableId === table.id && connectingFrom?.columnId === col.id && connectingFrom?.side === 'right';
        return (
          <g key={`ports-${col.id}`}>
            <circle
              cx={table.x} cy={cy} r={PORT_R}
              fill="white" stroke={typeDef.color} strokeWidth={2}
              className="cursor-crosshair"
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(table.id, col.id, 'left'); }}
              onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(table.id, col.id, 'left'); }}
            />
            <circle
              cx={table.x + TABLE_W} cy={cy} r={PORT_R}
              fill={activeRight ? typeDef.color : 'white'} stroke={typeDef.color} strokeWidth={2}
              className="cursor-crosshair"
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(table.id, col.id, 'right'); }}
              onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(table.id, col.id, 'right'); }}
            />
          </g>
        );
      })}
    </g>
  );
}
