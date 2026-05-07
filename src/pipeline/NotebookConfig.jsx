import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Save, Copy } from 'lucide-react';
import { CARD_DEFINITIONS, getCardDisplayInfo, getAllCards } from '../utils/cardDefinitions';
import Card from '../components/Card';
import ParamInputPopup from '../components/ParamInputPopup';
import { DojoEmojiAuto } from '../components/DojoEmoji';
import { runNotebook } from './notebooks';

/**
 * Modal editor for a notebook : metadata + visual pipeline of Data Dojo cards.
 *
 * Props :
 *   notebook        : the notebook object being viewed/edited
 *   readOnly        : true for system / exercise notebooks (Save → "Sauver comme nouveau")
 *   inputTable      : optional preview input rows (used to live-preview the output)
 *   onSave(updated) : called with the updated notebook (no save → still gets called)
 *   onSaveAsNew(updated) : create a fresh user notebook from this content
 *   onDelete()      : optional ; only shown for user notebooks
 *   onCancel()
 */
export default function NotebookConfig({
  notebook,
  readOnly = false,
  inputTable = null,
  onSave,
  onSaveAsNew,
  onDelete,
  onCancel,
}) {
  const [name, setName] = useState(notebook?.name || '');
  const [description, setDescription] = useState(notebook?.description || '');
  const [cards, setCards] = useState(() => (notebook?.cards || []).map(c => ({ ...c })));
  const [paramPopup, setParamPopup] = useState(null); // { mode: 'add'|'edit', cardType, cardIdx? }

  // Notebooks process a single table : join/concat take 2 inputs, they live as
  // standalone canvas nodes and don't belong inside a notebook.
  const handCards = useMemo(
    () => getAllCards().filter(c => c.type !== 'join' && c.type !== 'concat'),
    []
  );

  const removeCard = (idx) => setCards(cs => cs.filter((_, i) => i !== idx));
  const moveCard = (idx, dir) => {
    setCards(cs => {
      const next = [...cs];
      const tgt = idx + dir;
      if (tgt < 0 || tgt >= next.length) return next;
      [next[idx], next[tgt]] = [next[tgt], next[idx]];
      return next;
    });
  };

  // Compute the columns/rows that flow INTO a given step (or end-of-pipeline if idx == cards.length).
  const computeUpstream = (uptoIdx) => {
    const baseRows = Array.isArray(inputTable) ? inputTable : [];
    const slice = cards.slice(0, uptoIdx);
    let rows = baseRows;
    try {
      rows = runNotebook({ cards: slice }, baseRows);
    } catch {
      rows = baseRows;
    }
    const cols = rows.length > 0
      ? Object.keys(rows[0])
      : (baseRows.length > 0 ? Object.keys(baseRows[0]) : []);
    return { cols, rows };
  };

  const openAddPopup = (cardType) => {
    if (readOnly) return;
    setParamPopup({ mode: 'add', cardType });
  };
  const openEditPopup = (idx) => {
    if (readOnly) return;
    setParamPopup({ mode: 'edit', cardType: cards[idx].type, cardIdx: idx });
  };

  const handleConfirmParams = (params) => {
    if (!paramPopup) return;
    if (paramPopup.mode === 'add') {
      const def = CARD_DEFINITIONS[paramPopup.cardType];
      setCards(cs => [...cs, { type: paramPopup.cardType, name: def?.name || paramPopup.cardType, params }]);
    } else {
      setCards(cs => cs.map((c, i) => (i === paramPopup.cardIdx ? { ...c, params } : c)));
    }
    setParamPopup(null);
  };

  const buildPayload = () => ({
    ...notebook,
    name: name.trim() || 'Sans nom',
    description,
    inputTable: notebook?.inputTable || '',
    outputTable: notebook?.outputTable || '',
    cards: cards.map(({ ...rest }) => rest),
  });

  // Live preview of the output table when inputTable is provided.
  const previewRows = useMemo(() => {
    if (!inputTable || !Array.isArray(inputTable)) return null;
    try {
      return runNotebook({ cards }, inputTable);
    } catch {
      return null;
    }
  }, [cards, inputTable]);

  const previewCols = previewRows && previewRows.length > 0 ? Object.keys(previewRows[0]) : [];
  const previewLimited = previewRows ? previewRows.slice(0, 6) : null;

  // Popup context : columns/rows that feed into the card being added/edited.
  const popupContext = useMemo(() => {
    if (!paramPopup) return { cols: [], rows: [] };
    const upto = paramPopup.mode === 'edit' ? paramPopup.cardIdx : cards.length;
    return computeUpstream(upto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramPopup, cards, inputTable]);

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 inline-flex"><DojoEmojiAuto native="📓" size={28} /></span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800 truncate">
                {readOnly ? 'Notebook (lecture seule)' : 'Éditer le notebook'}
              </h3>
              <p className="text-xs text-slate-500">
                {notebook?.source === 'system' ? 'Notebook système' : notebook?.source === 'exercise' ? 'Notebook fourni par l\'exercice' : 'Notebook utilisateur'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-bold">×</button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-5">
          {/* Metadata : just name + description */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Nom</label>
              <input
                type="text" value={name} disabled={readOnly}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border-2 border-slate-200 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="ex: clean_clients"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
              <input
                type="text" value={description} disabled={readOnly}
                onChange={e => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border-2 border-slate-200 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="ex: Dédoublonne et nettoie les clients"
              />
            </div>
          </div>

          {/* Pipeline : visual cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pipeline ({cards.length} carte{cards.length > 1 ? 's' : ''})
            </label>
            {cards.length === 0 ? (
              <div className="mt-1 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 bg-slate-50/50">
                Aucune carte. {!readOnly && "Choisis une transformation ci-dessous pour démarrer."}
              </div>
            ) : (
              <ol className="mt-2 flex flex-wrap gap-3 justify-center py-2">
                {cards.map((card, i) => {
                  const info = getCardDisplayInfo(card);
                  if (!info) return null;
                  return (
                    <li key={i} className="flex flex-col items-center">
                      <Card
                        cardInfo={info}
                        isInPipeline={true}
                        size="medium"
                        onEdit={!readOnly ? () => openEditPopup(i) : null}
                        onRemove={!readOnly ? () => removeCard(i) : null}
                      />
                      {!readOnly && (
                        <div className="flex gap-1 mt-1.5">
                          <button
                            onClick={() => moveCard(i, -1)}
                            disabled={i === 0}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
                            title="Reculer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCard(i, 1)}
                            disabled={i === cards.length - 1}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
                            title="Avancer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Hand : horizontally scrollable cards (Data Dojo style) */}
          {!readOnly && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Ajouter une transformation
              </label>
              <div className="mt-2 -mx-1 px-1 overflow-x-auto py-3">
                <div className="flex gap-3 w-max mx-auto">
                  {handCards.map(card => (
                    <Card
                      key={card.type}
                      cardInfo={card}
                      size="medium"
                      noShadow
                      onClick={() => openAddPopup(card.type)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live preview */}
          {previewLimited && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Aperçu de la sortie
                <span className="ml-1.5 text-slate-400 normal-case font-medium tracking-normal">
                  ({previewRows.length} ligne{previewRows.length > 1 ? 's' : ''}{previewCols.length > 0 ? `, ${previewCols.length} colonne${previewCols.length > 1 ? 's' : ''}` : ''})
                </span>
              </label>
              <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-b from-slate-50 to-slate-100/80 border-b border-slate-200">
                        {previewCols.map(c => (
                          <th key={c} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewLimited.length === 0 ? (
                        <tr>
                          <td colSpan={Math.max(previewCols.length, 1)} className="px-3 py-6 text-center text-xs text-slate-400 italic">
                            Aucune ligne en sortie
                          </td>
                        </tr>
                      ) : (
                        previewLimited.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-indigo-50/40 transition-colors`}
                          >
                            {previewCols.map(c => (
                              <td key={c} className="px-3 py-1.5 font-mono text-[12px] text-[#2B2D42] whitespace-nowrap">
                                {String(row[c] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {previewRows.length > 6 && (
                  <div className="text-[11px] text-slate-500 text-center py-1.5 bg-slate-50 border-t border-slate-200">
                    … et {previewRows.length - 6} ligne{previewRows.length - 6 > 1 ? 's' : ''} de plus
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {!readOnly && onDelete && (
              <button onClick={onDelete} className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">Supprimer</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Annuler</button>
            {onSaveAsNew && (
              <button
                onClick={() => onSaveAsNew(buildPayload())}
                disabled={!name.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 flex items-center gap-1.5"
                title="Créer un nouveau notebook utilisateur basé sur celui-ci"
              >
                <Copy className="w-3.5 h-3.5" /> Sauver comme nouveau
              </button>
            )}
            {!readOnly && onSave && (
              <button
                onClick={() => onSave(buildPayload())}
                disabled={!name.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Sauver
              </button>
            )}
          </div>
        </div>
      </div>

      {paramPopup && (() => {
        const def = CARD_DEFINITIONS[paramPopup.cardType];
        const initialParams = paramPopup.mode === 'edit' ? cards[paramPopup.cardIdx]?.params || null : null;
        return (
          <ParamInputPopup
            cardType={paramPopup.cardType}
            cardName={def?.name || paramPopup.cardType}
            cardIcon={def?.icon || '🃏'}
            columns={popupContext.cols}
            tableData={popupContext.rows}
            onConfirm={handleConfirmParams}
            onCancel={() => setParamPopup(null)}
            initialParams={initialParams}
          />
        );
      })()}
    </div>,
    document.body
  );
}
