import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';

function PipelineStartZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'pipeline-start' });
  return (
    <div
      ref={setNodeRef}
      className={`w-4 shrink-0 rounded-l-lg transition-colors ${isOver ? 'bg-indigo-200' : ''}`}
    />
  );
}

function PipelineEndZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'pipeline-end' });
  return (
    <div
      ref={setNodeRef}
      className={`w-8 shrink-0 rounded-r-lg transition-colors flex items-center justify-center ${isOver ? 'bg-indigo-200' : ''}`}
    >
      {isOver && <span className="text-indigo-400 text-xl font-bold">+</span>}
    </div>
  );
}

function EmptyPipelineDrop() {
  const { setNodeRef, isOver } = useDroppable({ id: 'pipeline-empty' });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border-2 border-dashed rounded-lg flex items-center justify-center min-h-[60px] sm:min-h-[80px] md:min-h-[140px] transition-colors ${
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50'
      }`}
    >
      <p className="text-slate-500 text-xs sm:text-sm font-medium text-center px-2">
        Glissez ou selectionnez des cartes
      </p>
    </div>
  );
}

function InsertPlaceholder() {
  return (
    <div className="flex items-center shrink-0 mx-1">
      <div className="w-1.5 h-20 sm:h-24 md:h-32 bg-indigo-400 rounded-full animate-pulse" />
    </div>
  );
}

function MiniTable({ data }) {
  if (!data || data.length === 0) return null;
  const cols = Object.keys(data[0]);
  const rows = data.slice(0, 4);
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2 max-w-[280px]">
      <table className="text-[9px] border-collapse w-full">
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} className="px-1 py-0.5 bg-slate-100 text-slate-600 font-semibold border border-slate-200 whitespace-nowrap truncate max-w-[60px]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map(c => (
                <td key={c} className="px-1 py-0.5 text-slate-700 border border-slate-200 whitespace-nowrap truncate max-w-[60px]">
                  {row[c] === '' || row[c] === null || row[c] === undefined
                    ? <span className="text-slate-400 italic">vide</span>
                    : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 4 && (
        <p className="text-[8px] text-slate-400 text-center mt-1">+{data.length - 4} lignes...</p>
      )}
    </div>
  );
}

function SortableCard({ card, index, onRemove, onEditCard, isHovered, intermediateTable, onHoverCard, onLeaveCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const cardRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  // Compute fixed position for the tooltip based on card's bounding rect
  const getTooltipStyle = () => {
    if (!cardRef.current) return { top: 0, left: 0 };
    const rect = cardRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      left: rect.left + rect.width / 2,
      top: rect.top - 8,
      transform: 'translate(-50%, -100%)',
      zIndex: 9999,
      pointerEvents: 'none',
    };
  };

  return (
    <div className="flex items-center shrink-0 relative" ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Hover preview tooltip — rendered via portal to avoid clipping */}
      {isHovered && intermediateTable && createPortal(
        <div style={getTooltipStyle()}>
          <MiniTable data={intermediateTable} />
        </div>,
        document.body
      )}

      <div
        ref={cardRef}
        onMouseEnter={() => onHoverCard && onHoverCard(index)}
        onMouseLeave={() => onLeaveCard && onLeaveCard()}
      >
        <div className="block md:hidden">
          <Card
            cardInfo={card}
            isInPipeline={true}
            onRemove={onRemove}
            onEdit={onEditCard}
            size="small"
          />
        </div>
        <div className="hidden md:block">
          <Card
            cardInfo={card}
            isInPipeline={true}
            onRemove={onRemove}
            onEdit={onEditCard}
            size="medium"
          />
        </div>
      </div>
    </div>
  );
}

export default function Pipeline({ cards, onRemoveCard, onReset, onEditCard, onUndo, onHoverCard, onLeaveCard, hoveredIndex, intermediateTable, isOverPipeline, handInsertIndex }) {
  return (
    <div className="game-panel p-2 sm:p-4 h-full flex flex-col overflow-visible" data-tutorial="pipeline">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-700">
          Pipeline
        </span>
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <>
              <button
                onClick={onUndo}
                className="game-btn px-2 sm:px-3 py-1 text-xs text-slate-500 hover:text-slate-700 font-semibold"
                title="Annuler la derniere carte"
              >
                Annuler
              </button>
              <button
                onClick={onReset}
                className="game-btn px-2 sm:px-3 py-1 text-xs text-red-500 hover:text-red-600 font-semibold"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyPipelineDrop />
      ) : (
        <SortableContext items={cards.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex-1 flex items-center justify-start sm:justify-center overflow-x-auto py-1 min-h-[60px] sm:min-h-[80px] md:min-h-[140px] px-1">
            <PipelineStartZone />
            {cards.map((card, index) => (
              <div key={card.id} className="flex items-center shrink-0">
                {handInsertIndex === index && <InsertPlaceholder />}
                <SortableCard
                  card={card}
                  index={index}
                  onRemove={onRemoveCard}
                  onEditCard={onEditCard}
                  isHovered={hoveredIndex === index}
                  intermediateTable={hoveredIndex === index ? intermediateTable : null}
                  onHoverCard={onHoverCard}
                  onLeaveCard={onLeaveCard}
                />
                {index < cards.length - 1 && (
                  <span className="mx-1 sm:mx-2 text-lg sm:text-xl text-amber-500 font-bold">{'\u2192'}</span>
                )}
              </div>
            ))}
            {handInsertIndex === cards.length && <InsertPlaceholder />}
            <PipelineEndZone />
          </div>
        </SortableContext>
      )}
    </div>
  );
}
