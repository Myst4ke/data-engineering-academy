export default function CardInfo({ cardInfo, onClose }) {
  if (!cardInfo) return null;

  const { example } = cardInfo;

  return (
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="game-panel max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-[#FFE5DC] to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{cardInfo.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-[#E85D41]">{cardInfo.name}</h2>
                <p className="text-slate-500 font-mono text-sm">{cardInfo.shortName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xl transition-colors text-slate-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase text-[#FF8066] mb-2">Description</h3>
            <p className="text-slate-700">{cardInfo.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase text-[#FF8066] mb-2">Comment ça marche</h3>
            <div className="text-slate-600 text-sm whitespace-pre-line bg-slate-50 rounded-lg p-3 border border-slate-200">
              {cardInfo.detailedExplanation}
            </div>
          </div>

          {example && (
            <div>
              <h3 className="text-sm font-bold uppercase text-[#FF8066] mb-2">Exemple</h3>
              {/* Special layout for join with two input tables */}
              {example.secondTable ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <span className="text-xs text-blue-600 font-bold uppercase">Table 1</span>
                      <MiniTable data={example.before} />
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <span className="text-xs text-purple-600 font-bold uppercase">Table 2</span>
                      <MiniTable data={example.secondTable} />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span className="text-2xl text-slate-400">↓</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <span className="text-xs text-emerald-600 font-bold uppercase">Résultat</span>
                    <MiniTable data={example.after} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="text-xs text-red-600 font-bold uppercase">Avant</span>
                    <MiniTable data={example.before} />
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <span className="text-xs text-emerald-600 font-bold uppercase">Après</span>
                    <MiniTable data={example.after} />
                  </div>
                </div>
              )}
            </div>
          )}

          {cardInfo.paramLabel && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-xs text-amber-600 font-bold uppercase">Paramètres configurés</span>
              <p className="text-amber-700 font-mono mt-1">{cardInfo.paramLabel}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="game-btn w-full py-2 text-slate-700 font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniTable({ data }) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#E85D41] border-b border-slate-200">
            {columns.map((col) => (
              <th key={col} className="px-2 py-1 text-left font-bold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="text-slate-700 border-b border-slate-100">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1">{row[col] || <span className="text-slate-400">-</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
