import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * DojoIntro — popup explicative affichee a la premiere visite d'un dojo.
 * Peut etre reouverte via un bouton "?" dans le dojo.
 *
 * Props:
 *  - dojoId: string (ex: 'data-dojo', 'pipeline-dojo', 'bi-dojo') — cle localStorage
 *  - title: string — titre du dojo
 *  - icon: string — emoji
 *  - color: string — tailwind gradient (ex: 'from-indigo-500 to-purple-600')
 *  - sections: [{ title, content, icon }] — les sections explicatives
 *  - onClose: () => void
 */
export default function DojoIntro({ dojoId, title, icon, color, sections, onClose }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-5 bg-gradient-to-r ${color} text-white`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="text-xl font-black">{title}</h2>
              <p className="text-white/80 text-xs font-medium mt-0.5">Guide d'introduction</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {sections.map((section, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">{section.icon}</span>
                <h3 className="text-sm font-bold text-slate-800">{section.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-7">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-500"
              onChange={e => {
                if (e.target.checked) localStorage.setItem(`${dojoId}_introSeen`, '1');
                else localStorage.removeItem(`${dojoId}_introSeen`);
              }} />
            <span className="text-[10px] text-slate-400">Ne plus afficher</span>
          </label>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl bg-gradient-to-r ${color} text-white text-sm font-bold hover:opacity-90 transition-opacity`}>
            C'est parti !
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
    <button onClick={() => setShow(true)}
      className={`w-7 h-7 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 text-xs font-bold flex items-center justify-center transition-colors ${className}`}
      title="A propos de ce module">
      ?
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
  color: 'from-indigo-500 to-purple-600',
  sections: [
    {
      icon: '🎯',
      title: 'Objectif',
      content: 'Apprenez les operations fondamentales de transformation de donnees : filtrage, tri, jointure, deduplication, nettoyage. Ce sont les gestes de base de tout data engineer ou data analyst au quotidien.',
    },
    {
      icon: '🏢',
      title: 'Dans le monde reel',
      content: 'Chaque jour, les equipes data recoivent des fichiers CSV, des exports de bases de donnees ou des flux API contenant des erreurs : doublons, valeurs manquantes, colonnes mal nommees. Savoir nettoyer et transformer ces donnees est la competence #1 du metier.',
    },
    {
      icon: '🃏',
      title: 'Comment ca marche',
      content: 'Vous disposez d\'un jeu de cartes representant des transformations (Filtrer, Trier, Joindre...). Glissez-les dans le pipeline pour transformer la table d\'entree jusqu\'a obtenir le resultat attendu. Moins vous utilisez de cartes, plus votre score est eleve.',
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: '36 exercices repartis en 4 niveaux (Facile → Expert). Chaque exercice est note de 1 a 3 etoiles selon le nombre de cartes utilisees. Completez un niveau pour debloquer le suivant.',
    },
  ],
};

export const PIPELINE_DOJO_INTRO = {
  dojoId: 'pipeline-dojo',
  title: 'Pipeline Dojo',
  icon: '🔧',
  color: 'from-cyan-500 to-blue-600',
  sections: [
    {
      icon: '🎯',
      title: 'Objectif',
      content: 'Concevez des pipelines ETL (Extract-Transform-Load) complets en connectant visuellement des sources, des transformations et des destinations. Vous passez de la transformation unitaire (Data Dojo) a l\'orchestration de flux de donnees.',
    },
    {
      icon: '🏢',
      title: 'Dans le monde reel',
      content: 'Les entreprises utilisent des outils comme Azure Data Factory, Airflow ou dbt pour automatiser le chargement et la transformation de leurs donnees. Un pipeline bien concu garantit que les donnees arrivent propres, enrichies et a l\'heure pour les analystes et les dashboards.',
    },
    {
      icon: '🗃️',
      title: 'Architecture Medallion',
      content: 'Vous decouvrirez l\'architecture Bronze / Silver / Gold : les donnees brutes arrivent dans le Bronze, sont nettoyees dans le Silver, puis agregees dans le Gold pour la BI. C\'est le standard utilise par les lakehouse modernes (Databricks, Microsoft Fabric).',
    },
    {
      icon: '🔗',
      title: 'Comment ca marche',
      content: 'Ajoutez des noeuds depuis la palette, connectez-les via les ports (cercles), et configurez-les par clic droit. Le pipeline s\'execute en temps reel. Vous pouvez aussi exporter vos resultats vers le BI Dojo pour creer des dashboards.',
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: '32 exercices avec des scenarios metier realistes (e-commerce, RH). Chaque exercice decrit un besoin concret et vous guide vers la solution. Un mode Bac a sable est disponible pour experimenter librement.',
    },
  ],
};

export const BI_DOJO_INTRO = {
  dojoId: 'bi-dojo',
  title: 'BI Dojo',
  icon: '📊',
  color: 'from-emerald-500 to-teal-600',
  sections: [
    {
      icon: '🎯',
      title: 'Objectif',
      content: 'Creez des tableaux de bord interactifs pour visualiser et analyser des donnees. Vous apprenez a choisir le bon type de graphique selon la question metier et a construire des dashboards clairs pour les decideurs.',
    },
    {
      icon: '🏢',
      title: 'Dans le monde reel',
      content: 'Les outils BI (Power BI, Tableau, Looker) sont utilises quotidiennement par les entreprises pour piloter leur activite. Un bon dashboard raconte une histoire avec les donnees : KPIs en haut, tendances au milieu, details en bas. Savoir le construire est essentiel.',
    },
    {
      icon: '🔧',
      title: 'Lien avec le Pipeline',
      content: 'Certains exercices utilisent des tables pre-agregees issues du Pipeline Dojo (marquees 🔧). Dans la realite, les dashboards BI consomment des donnees transformees par les pipelines ETL — vous vivez ici la chaine complete du data engineer au data analyst.',
    },
    {
      icon: '📈',
      title: 'Comment ca marche',
      content: 'Ajoutez des widgets (KPI, barres, camembert, ligne, jauge, treemap...) depuis la sidebar, configurez-les avec le selecteur de colonnes et d\'agregation, et organisez-les par glisser-deposer. Chaque widget peut utiliser une table differente.',
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: '20 exercices repartis en 4 niveaux. Des widgets simples aux dashboards multi-pages multi-tables avec slicers interactifs. Un mode Bac a sable permet de creer des dashboards librement.',
    },
  ],
};
