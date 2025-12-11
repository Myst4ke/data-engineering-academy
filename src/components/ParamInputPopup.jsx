import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function ParamInputPopup({ cardType, cardName, cardIcon, columns, tableData, onConfirm, onCancel }) {
  const [column, setColumn] = useState('');
  const [value, setValue] = useState('');
  const [order, setOrder] = useState('asc');

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
    setValue(''); // Reset value when column changes
  };

  const handleConfirm = () => {
    let params = {};

    switch (cardType) {
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
      default:
        break;
    }

    onConfirm(params);
  };

  const isValid = () => {
    if (!column) return false;
    if (cardType === 'filter' && !value) return false;
    return true;
  };

  const getTitle = () => {
    switch (cardType) {
      case 'delete':
        return 'Quelle colonne supprimer ?';
      case 'filter':
        return 'Définir le filtre';
      case 'sort':
        return 'Trier par quelle colonne ?';
      case 'join':
        return 'Sur quelle colonne joindre ?';
      default:
        return 'Paramètres';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="game-panel max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{cardIcon}</span>
          <div>
            <h3 className="text-lg font-bold text-indigo-600">{cardName}</h3>
            <p className="text-slate-500 text-sm">{getTitle()}</p>
          </div>
        </div>

        {/* Column Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Colonne
          </label>
          <select
            value={column}
            onChange={(e) => handleColumnChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-indigo-400 focus:outline-none transition-colors"
          >
            <option value="">-- Sélectionner --</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Filter Value Selection (dropdown with column values) */}
        {cardType === 'filter' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Valeur
            </label>
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!column}
              className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-700 focus:border-indigo-400 focus:outline-none transition-colors disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">-- Sélectionner une valeur --</option>
              {columnValues.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            {!column && (
              <p className="text-xs text-slate-400 mt-1">Sélectionnez d'abord une colonne</p>
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
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                ↑ Croissant
              </button>
              <button
                onClick={() => setOrder('desc')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                  order === 'desc'
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                ↓ Décroissant
              </button>
            </div>
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
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
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
