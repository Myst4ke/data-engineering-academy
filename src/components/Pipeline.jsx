import Card from './Card';

export default function Pipeline({ cards, onRemoveCard, onReset }) {
  return (
    <div className="game-panel p-4 h-full flex flex-col overflow-visible">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-700">
          🎮 Pipeline
        </span>
        {cards.length > 0 && (
          <button
            onClick={onReset}
            className="game-btn px-3 py-1 text-xs text-red-500 hover:text-red-600 font-semibold"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="flex-1 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 min-h-[180px]">
          <p className="text-slate-500 text-sm font-medium">
            ↓ Sélectionnez des cartes ci-dessous ↓
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-3 overflow-x-auto py-2 min-h-[180px]">
          {cards.map((card, index) => (
            <div key={`${card.id}-${index}`} className="flex items-center shrink-0">
              <Card
                cardInfo={card}
                isInPipeline={true}
                onRemove={onRemoveCard}
              />
              {index < cards.length - 1 && (
                <span className="mx-2 text-2xl text-amber-500 font-bold">→</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
