import { useState, useEffect, useMemo } from 'react';
import { Flame, ArrowRight, Sprout } from 'lucide-react';
import App from './App';
import PipelineDojo from './pipeline/PipelineDojo';
import BiDojoWrapper from './bi/BiDojoWrapper';
import GitDojo from './git/GitDojo';
import { DojoEmojiAuto } from './components/DojoEmoji';

// Les 3 modules actifs : chacun avec sa couleur d'accent edtech
const MODULES = [
  {
    id: 'data-dojo',
    name: 'Data Dojo',
    subtitle: 'Nettoyage & transformation',
    kata: 'Kata I',
    icon: '🧹',
    description: 'Nettoyez et transformez vos données avec des cartes de transformation.',
    accent: 'coral',
    totalExercises: 36,
  },
  {
    id: 'pipeline-dojo',
    name: 'Pipeline Dojo',
    subtitle: 'Conception de pipelines ETL',
    kata: 'Kata II',
    icon: '🔧',
    description: 'Concevez des pipelines ETL en connectant sources, transformations et destinations.',
    accent: 'sky',
    totalExercises: 32,
  },
  {
    id: 'bi-dojo',
    name: 'BI Dojo',
    subtitle: 'Visualisation de données',
    kata: 'Kata III',
    icon: '📊',
    description: 'Créez des tableaux de bord interactifs pour analyser vos données.',
    accent: 'mint',
    totalExercises: 20,
  },
  {
    id: 'git-dojo',
    name: 'Git Dojo',
    subtitle: 'Gestion de versions',
    kata: 'Kata IV',
    icon: '🌿',
    description: 'Branches, commits, merges et workflows collaboratifs.',
    accent: 'forest',
    totalExercises: 8,
  },
];

// Module en préparation : teaser distinct en bas de page
const UPCOMING_MODULES = [
  {
    id: 'data-modeling-dojo',
    name: 'Data Modeling Dojo',
    subtitle: 'Modélisation dimensionnelle',
    icon: '📐',
    description: 'Modèles en étoile, faits & dimensions, grain, SCD : concevez les schémas des datamarts.',
  },
];

function readProgress(moduleId) {
  try {
    if (moduleId === 'data-dojo') {
      const raw = localStorage.getItem('dataDojo');
      return raw ? (JSON.parse(raw).completed?.length || 0) : 0;
    }
    if (moduleId === 'pipeline-dojo') {
      const raw = localStorage.getItem('pipelineDojo_progress');
      if (!raw) return 0;
      const obj = JSON.parse(raw) || {};
      return Object.keys(obj).filter(k => obj[k]).length;
    }
    if (moduleId === 'bi-dojo') {
      const raw = localStorage.getItem('biDojo_exerciseProgress');
      if (!raw) return 0;
      const obj = JSON.parse(raw) || {};
      return Object.keys(obj).filter(k => obj[k]).length;
    }
    if (moduleId === 'git-dojo') {
      const raw = localStorage.getItem('gitDojo_progress');
      if (!raw) return 0;
      const obj = JSON.parse(raw) || {};
      return Object.keys(obj).filter(k => (obj[k]?.stars || 0) > 0).length;
    }
  } catch { /* corrupted localStorage */ }
  return 0;
}

// Palette d'accent : chaque module a sa couleur
const ACCENT_CLASSES = {
  coral: {
    border: 'border-[#FF8066]',
    isoBg: 'bg-[#FFE5DC]',
    tagBg: 'bg-[#FFE5DC] text-[#E85D41]',
    xpFill: 'bg-[#FF8066]',
    cta: 'bg-[#FF8066]',
    subtitle: 'text-[#E85D41]',
  },
  sky: {
    border: 'border-[#6BA4FF]',
    isoBg: 'bg-[#DCE8FF]',
    tagBg: 'bg-[#DCE8FF] text-[#3B7ADB]',
    xpFill: 'bg-[#6BA4FF]',
    cta: 'bg-[#6BA4FF]',
    subtitle: 'text-[#3B7ADB]',
  },
  mint: {
    border: 'border-[#5ED6B4]',
    isoBg: 'bg-[#D4F4E9]',
    tagBg: 'bg-[#D4F4E9] text-[#0F9B7A]',
    xpFill: 'bg-[#5ED6B4]',
    cta: 'bg-[#5ED6B4]',
    subtitle: 'text-[#0F9B7A]',
  },
  forest: {
    border: 'border-[#059669]',
    isoBg: 'bg-[#D1FAE5]',
    tagBg: 'bg-[#D1FAE5] text-[#047857]',
    xpFill: 'bg-[#059669]',
    cta: 'bg-[#059669]',
    subtitle: 'text-[#047857]',
  },
};

export default function Hub() {
  const [activeModule, setActiveModule] = useState(null);
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    if (activeModule === null) setProgressTick(t => t + 1);
  }, [activeModule]);

  const moduleProgress = useMemo(() => {
    const map = {};
    for (const mod of MODULES) map[mod.id] = readProgress(mod.id);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressTick]);

  const totalCompleted = useMemo(
    () => MODULES.reduce((sum, m) => sum + (moduleProgress[m.id] || 0), 0),
    [moduleProgress]
  );
  const totalPossible = useMemo(() => MODULES.reduce((s, m) => s + m.totalExercises, 0), []);

  if (activeModule === 'data-dojo')     return <App onBackToHub={() => setActiveModule(null)} />;
  if (activeModule === 'pipeline-dojo') return <PipelineDojo onBackToHub={() => setActiveModule(null)} />;
  if (activeModule === 'bi-dojo')       return <BiDojoWrapper onBackToHub={() => setActiveModule(null)} />;
  if (activeModule === 'git-dojo')      return <GitDojo onBackToHub={() => setActiveModule(null)} />;

  return (
    <div className="home-view flex flex-col items-center p-6 relative overflow-x-clip">
      {/* Decorative blobs: repeated pattern down the page */}
      <div className="hero-blobs" aria-hidden="true">
        <div className="blob" style={{ top: 20, left: '8%', width: 260, height: 260, background: '#FF8066' }} />
        <div className="blob" style={{ top: 50, right: '10%', width: 220, height: 220, background: '#5ED6B4' }} />
        <div className="blob" style={{ top: 180, left: '42%', width: 180, height: 180, background: '#FFC857' }} />
        <div className="blob" style={{ top: '45%', right: '4%', width: 240, height: 240, background: '#FF8066' }} />
        <div className="blob" style={{ top: '55%', left: '6%', width: 200, height: 200, background: '#5ED6B4' }} />
        <div className="blob" style={{ top: '70%', left: '45%', width: 220, height: 220, background: '#FFC857' }} />
        <div className="blob" style={{ top: '85%', left: '10%', width: 200, height: 200, background: '#FF8066' }} />
        <div className="blob" style={{ top: '90%', right: '8%', width: 220, height: 220, background: '#5ED6B4' }} />
      </div>

      <div className="max-w-5xl w-full mx-auto pt-12 sm:pt-16 pb-12">
        {/* HERO */}
        <header className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-6xl text-[#2B2D42] leading-[1.05] mb-4">
            Apprenez la data,<br />
            <span className="font-display-italic text-[#FF8066]">à votre rythme.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#5A6072] font-medium max-w-xl mx-auto leading-relaxed">
            Des exercices courts, une progression claire, un parcours qui s'accumule, de la transformation à la BI.
          </p>

          {totalCompleted > 0 && (
            <div className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-[#FFE5DC] text-[#E85D41] border-2 border-[#FF8066] rounded-full font-bold text-sm shadow-[0_6px_0_rgba(43,45,66,0.08)]">
              <Flame className="w-4 h-4" aria-hidden="true" />
              <span>{totalCompleted} exercice{totalCompleted > 1 ? 's' : ''} réussi{totalCompleted > 1 ? 's' : ''} sur {totalPossible}</span>
            </div>
          )}
        </header>

        {/* MODULES ACTIFS (3 cartes : vitrine pleine) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {MODULES.map((mod, idx) => {
            const completed = moduleProgress[mod.id] || 0;
            const pct = (completed / mod.totalExercises) * 100;
            const a = ACCENT_CLASSES[mod.accent];
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                aria-label={`Ouvrir ${mod.name}`}
                className={`group relative bg-white border-2 ${a.border} rounded-[22px] p-6 text-left transition-all duration-150 cursor-pointer shadow-[0_6px_0_rgba(43,45,66,0.08)] hover:-translate-y-[3px] hover:shadow-[0_9px_0_rgba(43,45,66,0.10)] active:translate-y-[4px] active:shadow-[0_2px_0_rgba(43,45,66,0.06)] flex flex-col h-full`}
              >
                <div>
                  <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center mb-4 ${a.isoBg}`} style={{ boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.08)' }} aria-hidden="true">
                    <DojoEmojiAuto native={mod.icon} size={44} />
                  </div>
                  <div className={`inline-block px-3 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-2 ${a.tagBg}`}>
                    {mod.kata}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl text-[#2B2D42] mb-1.5 tracking-tight">
                    {mod.name}
                  </h3>
                  <p className={`text-xs font-semibold ${a.subtitle} mb-2 uppercase tracking-wider`}>
                    {mod.subtitle}
                  </p>
                  <p className="text-sm text-[#5A6072] leading-relaxed font-medium">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-auto pt-4">
                  {/* XP bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#9CA3AF] mb-1">
                      <span>Progression</span>
                      <span className="text-[#2B2D42]">{completed} / {mod.totalExercises}</span>
                    </div>
                    <div className="h-2 bg-[#F4EADB] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${a.xpFill} transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>

                  <div className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white shadow-[0_4px_0_rgba(0,0,0,0.08)] ${a.cta}`}>
                    {completed > 0 ? 'Continuer' : 'Commencer'}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* FEUILLE DE ROUTE : modules à venir (teaser) */}
        {UPCOMING_MODULES.length > 0 && (
          <section className="border-t-2 border-dashed border-[#EDE3D2] pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="w-5 h-5 text-[#B88700]" aria-hidden="true" />
              <h2 className="font-display text-xl text-[#2B2D42]">
                Feuille de route
              </h2>
              <span className="text-xs text-[#9CA3AF] font-medium ml-1">modules en préparation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {UPCOMING_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white/60 border-2 border-dashed border-[#EDE3D2] rounded-[18px] p-4 opacity-80"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <DojoEmojiAuto native={mod.icon} size={28} />
                    <div>
                      <h3 className="font-display text-base text-[#2B2D42]">{mod.name}</h3>
                      <p className="text-xs text-[#9CA3AF] font-semibold uppercase tracking-wider">{mod.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#5A6072] leading-relaxed font-medium">{mod.description}</p>
                  <div className="mt-3 inline-block text-[11px] font-bold text-[#B88700] bg-[#FFF2D1] px-2.5 py-1 rounded-full">
                    Bientôt
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
