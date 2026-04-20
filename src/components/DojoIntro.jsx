import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

/**
 * DojoIntro — popup explicative affichée à la première visite d'un dojo.
 * Peut être rouverte via un bouton "?" dans le dojo.
 */
export default function DojoIntro({ dojoId, title, icon, color, sections, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dojo-intro-title"
    >
      <div className="modal-content game-panel w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-5 bg-gradient-to-r ${color} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <span className="text-3xl" aria-hidden="true">{icon}</span>
            <div>
              <h2 id="dojo-intro-title" className="text-xl font-black">{title}</h2>
              <p className="text-white/80 text-xs font-medium mt-0.5">Guide d'introduction</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {sections.map((section, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg" aria-hidden="true">{section.icon}</span>
                <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-7">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id={`${dojoId}-dont-show`}
              type="checkbox"
              defaultChecked
              className="rounded border-slate-300 text-indigo-500"
              onChange={e => {
                if (e.target.checked) localStorage.setItem(`${dojoId}_introSeen`, '1');
                else localStorage.removeItem(`${dojoId}_introSeen`);
              }}
            />
            <span className="text-xs text-slate-600">Ne plus afficher à l'ouverture</span>
          </label>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg bg-gradient-to-r ${color} text-white text-sm font-bold hover:opacity-90 transition-opacity`}
          >
            Commencer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Hook to manage intro popup visibility.
 * Returns [showIntro, setShowIntro, IntroButton] where IntroButton is a "?" button component.
 */
export function useDojoIntro(dojoId) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(`${dojoId}_introSeen`)) {
      setShow(true);
      localStorage.setItem(`${dojoId}_introSeen`, '1');
    }
  }, [dojoId]);

  const IntroButton = ({ className = '' }) => (
    <button
      onClick={() => setShow(true)}
      className={`w-7 h-7 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 flex items-center justify-center transition-colors ${className}`}
      title="À propos de ce module"
      aria-label="Revoir la présentation du module"
    >
      <HelpCircle className="w-4 h-4" aria-hidden="true" />
    </button>
  );

  return [show, setShow, IntroButton];
}

// ═══════════════════════════
// ── INTRO CONTENT PER DOJO ──
// ═══════════════════════════

export const DATA_DOJO_INTRO = {
  dojoId: 'data-dojo',
  title: 'Data Dojo',
  icon: '🧹',
  color: 'from-[#FF8066] to-[#E85D41]',
  sections: [
    {
      icon: '🎯',
      title: 'Objectif',
      content: 'Apprenez les opérations fondamentales de transformation de données : filtrage, tri, jointure, déduplication, nettoyage. Ce sont les gestes de base de tout data engineer ou data analyst au quotidien.',
    },
    {
      icon: '🏢',
      title: 'Dans le monde réel',
      content: 'Chaque jour, les équipes data reçoivent des fichiers CSV, des exports de bases de données ou des flux API contenant des erreurs : doublons, valeurs manquantes, colonnes mal nommées. Savoir nettoyer et transformer ces données est la compétence n°1 du métier.',
    },
    {
      icon: '🃏',
      title: 'Comment ça marche',
      content: 'Vous disposez d\'un jeu de cartes représentant des transformations (Filtrer, Trier, Joindre…). Glissez-les dans le pipeline pour transformer la table d\'entrée jusqu\'à obtenir le résultat attendu. Moins vous utilisez de cartes, plus votre score est élevé.',
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: '36 exercices répartis en 4 niveaux (Facile → Expert). Chaque exercice est noté de 1 à 3 étoiles selon le nombre de cartes utilisées. Complétez un niveau pour débloquer le suivant.',
    },
  ],
};

export const PIPELINE_DOJO_INTRO = {
  dojoId: 'pipeline-dojo',
  title: 'Pipeline Dojo',
  icon: '🔧',
  color: 'from-[#6BA4FF] to-[#3B7ADB]',
  sections: [
    {
      icon: '🎯',
      title: 'Objectif',
      content: 'Concevez des pipelines ETL (Extract-Transform-Load) complets en connectant visuellement des sources, des transformations et des destinations. Vous passez de la transformation unitaire (Data Dojo) à l\'orchestration de flux de données.',
    },
    {
      icon: '🏢',
      title: 'Dans le monde réel',
      content: 'Les entreprises utilisent des outils comme Azure Data Factory, Airflow ou dbt pour automatiser le chargement et la transformation de leurs données. Un pipeline bien conçu garantit que les données arrivent propres, enrichies et à l\'heure pour les analystes et les dashboards.',
    },
    {
      icon: '🗃️',
      title: 'Architecture Medallion',
      content: 'Vous découvrirez l\'architecture Bronze / Silver / Gold : les données brutes arrivent dans le Bronze, sont nettoyées dans le Silver, puis agrégées dans le Gold pour la BI. C\'est le standard utilisé par les lakehouses modernes (Databricks, Microsoft Fabric).',
    },
    {
      icon: '🔗',
      title: 'Comment ça marche',
      content: 'Ajoutez des nœuds depuis la palette, connectez-les via les ports (cercles), et configurez-les par clic droit. Le pipeline s\'exécute en temps réel. Vous pouvez aussi exporter vos résultats vers le BI Dojo pour créer des dashboards.',
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: '32 exercices avec des scénarios métier réalistes (e-commerce, RH). Chaque exercice décrit un besoin concret et vous guide vers la solution. Un mode Bac à sable est disponible pour expérimenter librement.',
    },
  ],
};

export const BI_DOJO_INTRO = {
  dojoId: 'bi-dojo',
  title: 'BI Dojo',
  icon: '📊',
  color: 'from-[#5ED6B4] to-[#0F9B7A]',
  sections: [
    {
      icon: '🎯',
      title: 'Objectif',
      content: 'Créez des tableaux de bord interactifs pour visualiser et analyser des données. Vous apprenez à choisir le bon type de graphique selon la question métier et à construire des dashboards clairs pour les décideurs.',
    },
    {
      icon: '🏢',
      title: 'Dans le monde réel',
      content: 'Les outils BI (Power BI, Tableau, Looker) sont utilisés quotidiennement par les entreprises pour piloter leur activité. Un bon dashboard raconte une histoire avec les données : KPIs en haut, tendances au milieu, détails en bas. Savoir le construire est essentiel.',
    },
    {
      icon: '🔧',
      title: 'Lien avec le Pipeline',
      content: 'Certains exercices utilisent des tables pré-agrégées issues du Pipeline Dojo (marquées 🔧). Dans la réalité, les dashboards BI consomment des données transformées par les pipelines ETL — vous vivez ici la chaîne complète du data engineer au data analyst.',
    },
    {
      icon: '📈',
      title: 'Comment ça marche',
      content: 'Ajoutez des widgets (KPI, barres, camembert, ligne, jauge, treemap…) depuis la sidebar, configurez-les avec le sélecteur de colonnes et d\'agrégation, et organisez-les par glisser-déposer. Chaque widget peut utiliser une table différente.',
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: '20 exercices répartis en 4 niveaux. Des widgets simples aux dashboards multi-pages multi-tables avec slicers interactifs. Un mode Bac à sable permet de créer des dashboards librement.',
    },
  ],
};
