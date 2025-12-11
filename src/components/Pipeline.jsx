import Card from './Card';

export default function Pipeline({ cards, onRemoveCard, onReset }) {
  return (
    <div className="game-panel p-2 sm:p-4 h-full flex flex-col overflow-visible">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-700">
          🎮 Pipeline
        </span>
        {cards.length > 0 && (
          <button
            onClick={onReset}
            className="game-btn px-2 sm:px-3 py-1 text-xs text-red-500 hover:text-red-600 font-semibold"
          >
            Reset
          </button>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 min-h-[60px] sm:min-h-[80px] md:min-h-[140px]">
          <p className="text-slate-500 text-xs sm:text-sm font-medium text-center px-2">
            ↓ Sélectionnez des cartes ↓
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-start sm:justify-center gap-1 sm:gap-3 overflow-x-auto py-1 min-h-[60px] sm:min-h-[80px] md:min-h-[140px] px-1">
          {cards.map((card, index) => (
            <div key={`${card.id}-${index}`} className="flex items-center shrink-0">
              {/* Small cards on mobile, medium on desktop */}
              <div className="block md:hidden">
                <Card
                  cardInfo={card}
                  isInPipeline={true}
                  onRemove={onRemoveCard}
                  size="small"
                />
              </div>
              <div className="hidden md:block">
                <Card
                  cardInfo={card}
                  isInPipeline={true}
                  onRemove={onRemoveCard}
                  size="medium"
                />
              </div>
              {index < cards.length - 1 && (
                <span className="mx-1 sm:mx-2 text-lg sm:text-xl text-amber-500 font-bold">→</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
