import { useState } from 'react';
import { parseCSV } from '../utils/csvParser';

export default function SandboxImport({ onImport, onCancel }) {
  const [csvText, setCsvText] = useState('');
  const [csvText2, setCsvText2] = useState('');
  const [showSecond, setShowSecond] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsText(file);
  };

  const handleImport = () => {
    setError('');
    try {
      const table = parseCSV(csvText);
      if (table.length === 0) { setError('Le CSV principal est vide.'); return; }
      const table2 = showSecond && csvText2.trim() ? parseCSV(csvText2) : null;
      onImport(table, table2);
    } catch (e) {
      setError('Erreur de parsing CSV: ' + e.message);
    }
  };

  const sampleCSV = `Nom,Age,Ville,Score
Alice,28,Paris,85
Bob,35,Lyon,92
Clara,22,Paris,
David,28,Marseille,78
Alice,28,Paris,85
Eve,31,,88`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="game-panel p-6">
        <h2 className="text-xl font-bold mb-4 text-indigo-600">Importer vos donnees</h2>

        {/* Main CSV */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-600">Table principale</label>
            <div className="flex gap-2">
              <label className="game-btn px-3 py-1 text-xs cursor-pointer">
                Fichier CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFileUpload(e, setCsvText)} />
              </label>
              <button onClick={() => setCsvText(sampleCSV)} className="game-btn px-3 py-1 text-xs text-indigo-500">
                Exemple
              </button>
            </div>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Collez votre CSV ici (avec en-tetes)..."
            className="w-full h-40 px-3 py-2 rounded-lg font-mono text-xs focus:outline-none resize-none bg-white border border-slate-200 text-slate-700 focus:border-indigo-400"
          />
        </div>

        {/* Second table toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showSecond} onChange={(e) => setShowSecond(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-600">Ajouter une table secondaire (pour join/concat)</span>
          </label>
        </div>

        {showSecond && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-600">Table secondaire</label>
              <label className="game-btn px-3 py-1 text-xs cursor-pointer">
                Fichier CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFileUpload(e, setCsvText2)} />
              </label>
            </div>
            <textarea
              value={csvText2}
              onChange={(e) => setCsvText2(e.target.value)}
              placeholder="Collez le CSV secondaire..."
              className="w-full h-28 px-3 py-2 rounded-lg font-mono text-xs focus:outline-none resize-none bg-white border border-slate-200 text-slate-700 focus:border-indigo-400"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 game-btn py-2 text-slate-500">Annuler</button>
          <button
            onClick={handleImport}
            disabled={!csvText.trim()}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              csvText.trim()
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}
