import { useState } from 'react';
import App from './App';
import PipelineDojo from './pipeline/PipelineDojo';
import BiDojo from './bi/BiDojo';

const MODULES = [
  {
    id: 'data-dojo',
    name: 'Data Dojo',
    subtitle: 'Nettoyage & transformation',
    icon: '🧹',
    description: 'Apprenez à nettoyer et transformer des données avec des cartes de transformation.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'pipeline-dojo',
    name: 'Pipeline Dojo',
    subtitle: 'Conception de pipelines ETL',
    icon: '🔧',
    description: 'Concevez des pipelines de données en connectant des sources, transformations et destinations.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'bi-dojo',
    name: 'BI Dojo',
    subtitle: 'Visualisation de données',
    icon: '📊',
    description: 'Créez des tableaux de bord interactifs avec des graphiques pour analyser vos données.',
    color: 'from-emerald-500 to-teal-600',
  },
];

export default function Hub() {
  const [activeModule, setActiveModule] = useState(null);

  if (activeModule === 'data-dojo') {
    return <App onBackToHub={() => setActiveModule(null)} />;
  }

  if (activeModule === 'pipeline-dojo') {
    return <PipelineDojo onBackToHub={() => setActiveModule(null)} />;
  }

  if (activeModule === 'bi-dojo') {
    return <BiDojo onBackToHub={() => setActiveModule(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
          DATA ENGINEERING
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 mb-2">
          ACADEMY
        </h2>
        <p className="text-slate-500 text-sm sm:text-base">Choisissez votre module d'apprentissage</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition-all hover:scale-[1.03] hover:shadow-xl hover:border-indigo-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="text-4xl mb-3">{mod.icon}</div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{mod.name}</h3>
            <p className="text-sm font-medium text-indigo-500 mb-2">{mod.subtitle}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
            <div className="mt-4 text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
              Commencer →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
