import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DATABASES, getAllTables } from './sampleData';

function PreviewTable({ table }) {
  if (!table || table.rows.length === 0) return <p className="text-slate-400 text-sm p-4">Aucune donnée</p>;
  const cols = table.columns;
  const rows = table.rows.slice(0, 20);
  return (
    <div className="overflow-auto h-full">
      <table className="text-xs border-collapse w-full">
        <thead className="sticky top-0">
          <tr>
            <th className="px-3 py-2 bg-slate-100 text-slate-500 font-medium text-left border-b border-slate-200 text-[10px]">#</th>
            {cols.map(c => (
              <th key={c} className="px-3 py-2 bg-slate-100 text-slate-600 font-semibold text-left border-b border-slate-200 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-indigo-50/50">
              <td className="px-3 py-1.5 text-slate-400 border-b border-slate-100 text-[10px]">{i + 1}</td>
              {cols.map(c => (
                <td key={c} className="px-3 py-1.5 text-slate-700 border-b border-slate-100 whitespace-nowrap">
                  {row[c] === '' ? <span className="text-slate-300 italic">vide</span> : row[c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rowCount > 20 && <p className="text-xs text-slate-400 text-center py-2">20/{table.rowCount} lignes</p>}
    </div>
  );
}

export default function TableExplorer({ onSelect, onClose, initialSelectedIds, customTables }) {
  const [search, setSearch] = useState('');
  const [selectedTables, setSelectedTables] = useState(() => new Set(initialSelectedIds || []));
  const [previewTable, setPreviewTable] = useState(null);

  // Use custom tables (from lakehouse) or default database tables
  const allTables = useMemo(() => customTables || getAllTables(), [customTables]);
  const dbIds = useMemo(() => {
    const ids = new Set(allTables.map(t => t.dbId));
    return [...ids];
  }, [allTables]);
  const [expandedDbs, setExpandedDbs] = useState(() => new Set(customTables ? dbIds : Object.keys(DATABASES)));

  const filteredTables = useMemo(() => {
    if (!search.trim()) return allTables;
    const q = search.toLowerCase();
    return allTables.filter(t => t.tableName.toLowerCase().includes(q) || t.dbName.toLowerCase().includes(q));
  }, [allTables, search]);

  const toggleDb = (dbId) => {
    setExpandedDbs(prev => { const n = new Set(prev); n.has(dbId) ? n.delete(dbId) : n.add(dbId); return n; });
  };

  const toggleTable = (table) => {
    setSelectedTables(prev => {
      const n = new Set(prev);
      n.has(table.id) ? n.delete(table.id) : n.add(table.id);
      return n;
    });
    setPreviewTable(table);
  };

  const handleConfirm = () => {
    const tables = allTables.filter(t => selectedTables.has(t.id));
    if (tables.length > 0) onSelect(tables);
  };

  return createPortal(
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-400 font-medium">Choisir les données</p>
            <h2 className="text-lg font-bold text-slate-800">Explorateur de tables</h2>
          </div>
          <div className="flex items-center gap-3">
            {selectedTables.size > 0 && (
              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-1 rounded-full">
                {selectedTables.size} table{selectedTables.size > 1 ? 's' : ''} sélectionnée{selectedTables.size > 1 ? 's' : ''}
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-bold">×</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: tree */}
          <div className="w-60 border-r border-slate-200 flex flex-col">
            <div className="p-2 border-b border-slate-100">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-400 focus:outline-none" />
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {(() => {
                // Group tables by database
                const grouped = {};
                filteredTables.forEach(t => {
                  if (!grouped[t.dbId]) grouped[t.dbId] = { name: t.dbName, icon: t.dbIcon, tables: [] };
                  grouped[t.dbId].tables.push(t);
                });
                return Object.entries(grouped).map(([dbId, group]) => (
                  <div key={dbId} className="mb-1">
                    <button onClick={() => toggleDb(dbId)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <span className="text-[10px] text-slate-400">{expandedDbs.has(dbId) ? '▼' : '▶'}</span>
                      <span>{group.icon}</span>
                      <span className="truncate">{group.name}</span>
                    </button>
                    {expandedDbs.has(dbId) && group.tables.map(table => (
                      <div key={table.id} className={`flex items-center pl-5 pr-2 py-1 rounded hover:bg-slate-50 group ${
                        previewTable?.id === table.id ? 'bg-indigo-50' : ''
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedTables.has(table.id)}
                          onChange={() => toggleTable(table)}
                          className="mr-2 rounded border-slate-300 shrink-0"
                        />
                        <button
                          onClick={() => setPreviewTable(table)}
                          className={`flex-1 flex items-center gap-1.5 text-left text-xs ${
                            previewTable?.id === table.id ? 'text-indigo-600 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <span className="text-slate-400">📋</span>
                          <span className="truncate">{table.tableName}</span>
                          <span className="ml-auto text-[10px] text-slate-400">{table.rowCount}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Right: preview */}
          <div className="flex-1 flex flex-col">
            {previewTable ? (
              <>
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Preview: <span className="text-indigo-600">{previewTable.dbName}.{previewTable.tableName}</span>
                  </span>
                  <span className="text-xs text-slate-400">{previewTable.rowCount} lignes · {previewTable.columns.length} colonnes</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <PreviewTable table={previewTable} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Cochez les tables à charger, cliquez pour prévisualiser
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Annuler</button>
          <button onClick={handleConfirm} disabled={selectedTables.size === 0}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedTables.size > 0 ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            Charger {selectedTables.size > 0 ? `(${selectedTables.size})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
