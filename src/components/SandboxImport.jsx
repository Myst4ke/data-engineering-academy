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

  const validateTable = (table, label) => {
    if (!Array.isArray(table) || table.length === 0) return `${label} est vide.`;
    const cols = Object.keys(table[0] || {});
    if (cols.length === 0) return `${label} n'a aucune colonne détectée. Vérifiez la ligne d'en-tête.`;
    const uniqueCols = new Set(cols.map(c => c.trim()));
    if (uniqueCols.size !== cols.length) return `${label} contient des noms de colonnes en doublon.`;
    const inconsistentRow = table.findIndex(row => Object.keys(row).length !== cols.length);
    if (inconsistentRow >= 0) return `${label} : la ligne ${inconsistentRow + 2} a un nombre de colonnes différent de l'en-tête.`;
    if (table.length > 1000) return `${label} est volumineux (${table.length} lignes). Réduisez à 1000 lignes maximum.`;
    return null;
  };

  const handleImport = () => {
    setError('');
    try {
      const table = parseCSV(csvText);
      const err1 = validateTable(table, 'La table principale');
      if (err1) { setError(err1); return; }

      let table2 = null;
      if (showSecond && csvText2.trim()) {
        table2 = parseCSV(csvText2);
        const err2 = validateTable(table2, 'La table secondaire');
        if (err2) { setError(err2); return; }
      }

      onImport(table, table2);
    } catch (e) {
      setError('Erreur de lecture CSV : ' + (e?.message || 'format invalide. Vérifiez séparateurs et guillemets.'));
    }
  };

  const sampleCSV = `Nom,Age,Ville,Score
Alice,28,Paris,85
Bob,35,Lyon,92
Clara,22,Paris,
David,28,Marseille,78
Alice,28,Paris,85
Eve,31,,88`;

  const sampleCSV2 = `Nom,Departement,Salaire
Alice,IT,3500
Bob,RH,2800
Frank,IT,4200
Clara,Finance,3100`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="game-panel p-6">
        <h2 className="text-xl font-bold mb-4 text-[#E85D41]">Importer vos données</h2>

        {/* Main CSV */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-600">Table principale</label>
            <div className="flex gap-2">
              <label className="game-btn px-3 py-1 text-xs cursor-pointer">
                Fichier CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFileUpload(e, setCsvText)} />
              </label>
              <button onClick={() => setCsvText(sampleCSV)} className="game-btn px-3 py-1 text-xs text-[#FF8066]">
                Exemple
              </button>
            </div>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Collez votre CSV ici (avec en-têtes)…"
            className="w-full h-40 px-3 py-2 rounded-lg font-mono text-xs focus:outline-none resize-none bg-white border border-slate-200 text-slate-700 focus:border-[#FF8066]"
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
              <div className="flex gap-2">
                <label className="game-btn px-3 py-1 text-xs cursor-pointer">
                  Fichier CSV
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFileUpload(e, setCsvText2)} />
                </label>
                <button onClick={() => setCsvText2(sampleCSV2)} className="game-btn px-3 py-1 text-xs text-[#FF8066]">
                  Exemple
                </button>
              </div>
            </div>
            <textarea
              value={csvText2}
              onChange={(e) => setCsvText2(e.target.value)}
              placeholder="Collez le CSV secondaire…"
              className="w-full h-28 px-3 py-2 rounded-lg font-mono text-xs focus:outline-none resize-none bg-white border border-slate-200 text-slate-700 focus:border-[#FF8066]"
            />
          </div>
        )}

        {error && (
          <div role="alert" className="text-red-700 text-sm mb-4 p-3 rounded-lg border border-red-200 bg-red-50">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 game-btn py-2 text-slate-600">Annuler</button>
          <button
            onClick={handleImport}
            disabled={!csvText.trim()}
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
              csvText.trim()
                ? 'bg-[#FF8066] hover:bg-[#E85D41] text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}
