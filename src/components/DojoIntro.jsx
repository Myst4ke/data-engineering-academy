import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';
import { DojoEmojiAuto } from './DojoEmoji';

// Palette alignée sur celle du Hub (Hub.jsx ACCENT_CLASSES)
const ACCENTS = {
  coral:  { main: '#FF8066', dark: '#E85D41', isoBg: '#FFE5DC', border: '#FF8066', tagText: '#E85D41' },
  sky:    { main: '#6BA4FF', dark: '#3B7ADB', isoBg: '#DCE8FF', border: '#6BA4FF', tagText: '#3B7ADB' },
  mint:   { main: '#5ED6B4', dark: '#0F9B7A', isoBg: '#D4F4E9', border: '#5ED6B4', tagText: '#0F9B7A' },
  forest: { main: '#059669', dark: '#047857', isoBg: '#D1FAE5', border: '#059669', tagText: '#047857' },
  violet: { main: '#8B5CF6', dark: '#6D28D9', isoBg: '#EDE9FE', border: '#8B5CF6', tagText: '#6D28D9' },
};

const KATA_BY_DOJO = {
  'data-dojo':     'Kata I',
  'pipeline-dojo': 'Kata II',
  'bi-dojo':       'Kata III',
  'git-dojo':      'Kata IV',
};

export default function DojoIntro({ dojoId, title, icon, accent = 'coral', sections, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const a = ACCENTS[accent] || ACCENTS.coral;
  const kata = KATA_BY_DOJO[dojoId];

  return createPortal(
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dojo-intro-title"
    >
      <div
        className="modal-content bg-white rounded-[22px] w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ border: `2px solid ${a.border}`, boxShadow: '0 12px 0 rgba(43,45,66,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header : carte d'accueil à l'esprit hub */}
        <div className="relative px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F4EADB] hover:bg-[#E4D9C5] text-[#5A6072] flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="flex items-start gap-4 pr-10">
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center flex-none"
              style={{ background: a.isoBg, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.08)' }}
              aria-hidden="true"
            >
              <DojoEmojiAuto native={icon} size={40} />
            </div>
            <div className="flex-1 min-w-0">
              {kata && (
                <div
                  className="inline-block px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ background: a.isoBg, color: a.tagText }}
                >
                  {kata}
                </div>
              )}
              <h2 id="dojo-intro-title" className="font-display text-2xl sm:text-[26px] text-[#2B2D42] tracking-tight leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mt-1">Guide d'introduction</p>
            </div>
          </div>
        </div>

        {/* Séparateur doux */}
        <div className="mx-6 border-t border-dashed border-[#EDE3D2]" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {sections.map((section, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1">
                <DojoEmojiAuto native={section.icon} size={22} />
                <h3 className="font-display text-base text-[#2B2D42] tracking-tight">{section.title}</h3>
              </div>
              <p className="text-[13px] text-[#5A6072] leading-relaxed pl-8 font-medium">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EDE3D2] bg-white flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id={`${dojoId}-dont-show`}
              type="checkbox"
              defaultChecked
              className="rounded border-[#E4D9C5]"
              style={{ accentColor: a.main }}
              onChange={e => {
                if (e.target.checked) localStorage.setItem(`${dojoId}_introSeen`, '1');
                else localStorage.removeItem(`${dojoId}_introSeen`);
              }}
            />
            <span className="text-xs text-[#5A6072] font-medium">Ne plus afficher à l'ouverture</span>
          </label>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-white text-sm font-bold shadow-[0_4px_0_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-[1px] active:translate-y-[1px]"
            style={{ background: a.main }}
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
      className={`w-7 h-7 rounded-full bg-[#F4EADB] hover:bg-[#E4D9C5] text-[#5A6072] hover:text-[#2B2D42] flex items-center justify-center transition-colors ${className}`}
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
  accent: 'coral',
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
  accent: 'sky',
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

export const GIT_DOJO_INTRO = {
  dojoId: 'git-dojo',
  title: 'Git Dojo',
  icon: '🌿',
  accent: 'violet',
  sections: [
    {
      icon: '📝',
      title: "C'est quoi Git ?",
      content: "Git, c'est le carnet de bord de ton projet. À chaque étape, tu prends une photo de tes fichiers (un commit). Plus tard, tu peux relire l'historique, ou même revenir à n'importe quelle photo si quelque chose casse. C'est une machine à remonter le temps pour ton code.",
    },
    {
      icon: '🏢',
      title: 'À quoi ça sert dans la vraie vie ?',
      content: "Tous les projets tech utilisent Git : sites web, applis, dashboards data, notebooks. Sans Git, impossible de travailler à plusieurs sans s'écraser, pas de retour en arrière en cas de bug, pas de trace de qui a changé quoi. C'est aussi ce qui fait tourner GitHub et GitLab.",
    },
    {
      icon: '💾',
      title: 'Trois étapes pour sauvegarder',
      content: "1. Tu modifies un fichier sur ton ordinateur. 2. Tu choisis lesquels mettre dans la prochaine photo (la zone de staging). 3. Tu prends la photo avec un petit message qui décrit ton changement (le commit). La photo est rangée dans l'album : l'historique du projet.",
    },
    {
      icon: '🌿',
      title: 'Les branches : essayer sans risque',
      content: "Une branche, c'est une copie parallèle de ton projet. Tu peux tester une nouvelle idée sur une branche 'essai' sans toucher la version principale 'main'. Si ça marche, tu fusionnes les deux (merge). Si ça rate, tu jettes la branche. Personne n'a vu. Pour passer d'une branche à l'autre, clique simplement sur son nom dans le graphe.",
    },
    {
      icon: '🃏',
      title: 'Comment jouer ici',
      content: "À droite, ton explorateur de fichiers. Glisse les fichiers rouges (modifiés) vers la Staging Zone, puis clique 'Commiter' dans la palette à gauche. Le graphe au centre dessine l'historique en temps réel. Double-clique un fichier pour le modifier. Pour switcher de branche, clique son nom dans le graphe ; pour en créer une nouvelle, utilise 'Nouvelle branche' dans la palette.",
    },
    {
      icon: '⭐',
      title: 'Progression',
      content: "31 exercices répartis en 4 niveaux : Snapshots (commits de base, création de fichiers), Branches (travailler en parallèle, multi-commits), Réécriture (amend, revert, rebase), Collaboration (gitflow, hotfix, cherry-pick, conflits, multi-équipes). Un mode Bac à sable est disponible pour tester librement. Le premier exercice est un tutoriel guidé.",
    },
  ],
};

export const BI_DOJO_INTRO = {
  dojoId: 'bi-dojo',
  title: 'BI Dojo',
  icon: '📊',
  accent: 'mint',
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
      content: 'Certains exercices utilisent des tables pré-agrégées issues du Pipeline Dojo (marquées 🔧). Dans la réalité, les dashboards BI consomment des données transformées par les pipelines ETL : vous vivez ici la chaîne complète du data engineer au data analyst.',
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
