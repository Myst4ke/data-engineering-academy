import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { DojoEmojiAuto } from './DojoEmoji';

export default function ParamInputPopup({ cardType, cardName, cardIcon, columns, tableData, onConfirm, onCancel, initialParams = null }) {
  const [column, setColumn] = useState('');
  const [value, setValue] = useState('');
  const [order, setOrder] = useState('asc');
  const [newName, setNewName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [dedupMode, setDedupMode] = useState('all');
  const [dedupColumns, setDedupColumns] = useState([]);
  const [cleanNaMode, setCleanNaMode] = useState('all');
  const [cleanNaColumns, setCleanNaColumns] = useState([]);

  // Pre-fill from initialParams when editing
  useEffect(() => {
    if (!initialParams) return;
    if (initialParams.column) setColumn(initialParams.column);
    if (initialParams.value) setValue(initialParams.value);
    if (initialParams.order) setOrder(initialParams.order);
    if (initialParams.newName) setNewName(initialParams.newName);
    if (initialParams.oldName) setColumn(initialParams.oldName);
    if (initialParams.columns) setSelectedColumns(initialParams.columns);
    if (initialParams.dedupMode) setDedupMode(initialParams.dedupMode);
    if (initialParams.dedupColumns) setDedupColumns(initialParams.dedupColumns);
    // For drop_duplicates with subset columns
    if (cardType === 'drop_duplicates' && initialParams.columns) {
      setDedupMode('subset');
      setDedupColumns(initialParams.columns);
    }
    if (cardType === 'delete_na' && initialParams.columns) {
      setCleanNaMode('subset');
      setCleanNaColumns(initialParams.columns);
    }
  }, [initialParams, cardType]);

  // Get unique values for the selected column (for filter)
  const columnValues = useMemo(() => {
    if (!column || !tableData || tableData.length === 0) return [];
    const values = new Set();
    tableData.forEach(row => {
      const val = row[column];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  }, [column, tableData]);

  const handleColumnChange = (newColumn) => {
    setColumn(newColumn);
    setValue('');
  };

  const toggleDedupColumn = (col) => {
    setDedupColumns(prev =>
      prev.includes(col)
        ? prev.filter(c => c !== col)
        : [...prev, col]
    );
  };

  const handleConfirm = () => {
    let params = {};

    switch (cardType) {
      case 'delete_na':
        params = cleanNaMode === 'subset' ? { columns: cleanNaColumns } : {};
        break;
      case 'drop_duplicates':
        params = dedupMode === 'subset' ? { columns: dedupColumns } : {};
        break;
      case 'delete':
      case 'join':
        params = { column };
        break;
      case 'filter':
        params = { column, value };
        break;
      case 'sort':
        params = { column, order };
        break;
      case 'rename':
        params = { oldName: column, newName };
        break;
      case 'select':
        params = { columns: selectedColumns };
        break;
      case 'fill_na':
        params = { column, value };
        break;
      case 'concat':
        params = {};
        break;
      default:
        break;
    }

    onConfirm(params);
  };

  const isValid = () => {
    if (cardType === 'concat') return true;
    if (cardType === 'delete_na') return cleanNaMode === 'all' || cleanNaColumns.length > 0;
    if (cardType === 'drop_duplicates') return dedupMode === 'all' || dedupColumns.length > 0;
    if (cardType === 'select') return selectedColumns.length > 0;
    if (!column) return false;
    if (cardType === 'filter' && !value) return false;
    if (cardType === 'fill_na' && !value) return false;
    if (cardType === 'rename' && !newName) return false;
    return true;
  };

  const toggleColumnSelection = (col) => {
    setSelectedColumns(prev =>
      prev.includes(col)
        ? prev.filter(c => c !== col)
        : [...prev, col]
    );
  };

  const showColumnDropdown = ['delete', 'filter', 'sort', 'join', 'rename', 'fill_na'].includes(cardType);

  const getTitle = () => {
    switch (cardType) {
      case 'delete_na':
        return 'Supprimer les lignes vides';
      case 'drop_duplicates':
        return 'Supprimer les doublons';
      case 'delete':
        return 'Quelle colonne supprimer ?';
      case 'filter':
        return 'Définir le filtre';
      case 'sort':
        return 'Trier par quelle colonne ?';
      case 'join':
        return 'Sur quelle colonne joindre ?';
      case 'rename':
        return 'Renommer une colonne';
      case 'select':
        return 'Quelles colonnes garder ?';
      case 'fill_na':
        return 'Remplir les cellules vides';
      case 'concat':
        return 'Empiler les tables';
      default:
        return 'Paramètres';
    }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="param-title"
    >
      <div
        className="game-panel modal-content max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <DojoEmojiAuto native={cardIcon} size={36} />
          <div>
            <h3 id="param-title" className="text-lg font-bold text-[#E85D41]">{cardName}</h3>
            <p className="text-slate-500 text-sm">{getTitle()}</p>
          </div>
        </div>

        {/* Drop Duplicates Mode */}
        {cardType === 'drop_duplicates' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mode de déduplication
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDedupMode('all')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm ${
                  dedupMode === 'all'
                    ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Toutes les colonnes
              </button>
              <button
                onClick={() => setDedupMode('subset')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm ${
                  dedupMode === 'subset'
                    ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Colonnes choisies
              </button>
            </div>
            {dedupMode === 'subset' && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Colonnes à considérer pour la déduplication">
                {columns.map((col) => {
                  const selected = dedupColumns.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => toggleDedupColumn(col)}
                      aria-pressed={selected}
                      className={`px-3 py-1.5 rounded-lg border-2 font-medium transition-all text-sm inline-flex items-center gap-1.5 ${
                        selected
                          ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      {col}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Delete NA Mode */}
        {cardType === 'delete_na' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Colonnes à vérifier
            </label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setCleanNaMode('all')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm ${cleanNaMode === 'all' ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                Toutes les colonnes
              </button>
              <button onClick={() => setCleanNaMode('subset')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm ${cleanNaMode === 'subset' ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                Colonnes choisies
              </button>
            </div>
            {cleanNaMode === 'subset' && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Colonnes à vérifier">
                {columns.map((col) => {
                  const selected = cleanNaColumns.includes(col);
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCleanNaColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                      aria-pressed={selected}
                      className={`px-3 py-1.5 rounded-lg border-2 font-medium transition-all text-sm inline-flex items-center gap-1.5 ${selected ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      {col}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {cleanNaMode === 'all' ? 'Supprime les lignes où n\'importe quelle cellule est vide.' : `Supprime les lignes vides dans : ${cleanNaColumns.join(', ') || '(aucune sélectionnée)'}`}
            </p>
          </div>
        )}

        {/* Column Sélection */}
        {showColumnDropdown && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Colonne
            </label>
            <select
              value={column}
              onChange={(e) => handleColumnChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-[#FF8066] focus:outline-none transition-colors"
            >
              <option value="">Sélectionner...</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Value Sélection (dropdown with column values) */}
        {cardType === 'filter' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Valeur
            </label>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!column}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-[#FF8066] focus:outline-none transition-colors disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Sélectionner une valeur...</option>
              {columnValues.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            {!column && (
              <p className="text-xs text-slate-500 mt-1">Sélectionnez d'abord une colonne.</p>
            )}
          </div>
        )}

        {/* Sort Order */}
        {cardType === 'sort' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ordre
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrder('asc')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  order === 'asc'
                    ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Croissant
              </button>
              <button
                onClick={() => setOrder('desc')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  order === 'desc'
                    ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Décroissant
              </button>
            </div>
          </div>
        )}

        {/* Rename - New Name Input */}
        {cardType === 'rename' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nouveau nom
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Entrez le nouveau nom..."
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-[#FF8066] focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Select - Multiple Column Sélection */}
        {cardType === 'select' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Colonnes à garder
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Colonnes à conserver">
              {columns.map((col) => {
                const selected = selectedColumns.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleColumnSelection(col)}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 rounded-lg border-2 font-medium transition-all text-sm inline-flex items-center gap-1.5 ${
                      selected
                        ? 'border-[#FF8066] bg-[#FFE5DC] text-[#E85D41]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    {col}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fill NA - Value Input */}
        {cardType === 'fill_na' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Valeur de remplacement
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Entrez la valeur..."
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-[#FF8066] focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Concat - Just info */}
        {cardType === 'concat' && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Les lignes de la table secondaire seront ajoutées sous la table actuelle.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid()}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              isValid()
                ? 'bg-[#FF8066] text-white hover:bg-[#E85D41]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
