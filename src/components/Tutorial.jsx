import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const STEPS = [
  {
    target: '[data-tutorial="current-table"]',
    title: 'Table d\'entrée',
    text: 'Voici vos données de départ. C\'est cette table que vous allez transformer.',
  },
  {
    target: '[data-tutorial="target-table"]',
    title: 'Objectif',
    text: 'Voici le résultat à obtenir. Comparez-le avec la table d\'entrée pour comprendre les transformations nécessaires.',
  },
  {
    target: '[data-tutorial="hint-btn"]',
    title: 'Indice',
    text: 'Besoin d\'aide ? Cliquez ici pour un indice sur les cartes à utiliser.',
  },
  {
    target: '[data-tutorial="pipeline"]',
    title: 'Pipeline',
    text: 'Les cartes jouées apparaissent ici dans l\'ordre. Réorganisez-les par glisser-déposer, modifiez leurs paramètres en cliquant dessus, ou supprimez-les.',
  },
  {
    target: '[data-tutorial="hand"]',
    title: 'Vos cartes',
    text: 'Choisissez une carte en cliquant dessus ou en la glissant vers le pipeline. Chaque carte effectue une transformation différente.',
  },
];

const TOOLTIP_W = 288;
const TOOLTIP_H = 200;
const MARGIN = 14;

function getTooltipStyle(targetEl) {
  if (!targetEl) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const rect = targetEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const clampLeft = (x) => Math.min(Math.max(MARGIN, x), vw - TOOLTIP_W - MARGIN);
  const clampTop = (y) => Math.min(Math.max(MARGIN, y), vh - TOOLTIP_H - MARGIN);

  const candidates = [
    { top: rect.top - MARGIN - TOOLTIP_H, left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2), fits: rect.top - MARGIN - TOOLTIP_H > 0 },
    { top: rect.bottom + MARGIN, left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2), fits: rect.bottom + MARGIN + TOOLTIP_H < vh },
    { top: clampTop(rect.top + rect.height / 2 - TOOLTIP_H / 2), left: rect.right + MARGIN, fits: rect.right + MARGIN + TOOLTIP_W < vw },
    { top: clampTop(rect.top + rect.height / 2 - TOOLTIP_H / 2), left: rect.left - MARGIN - TOOLTIP_W, fits: rect.left - MARGIN - TOOLTIP_W > 0 },
  ];

  const best = candidates.find(c => c.fits) || { top: clampTop(rect.top), left: clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2) };
  return { top: best.top, left: best.left };
}

function getSpotlightStyle(targetEl) {
  if (!targetEl) return {};
  const rect = targetEl.getBoundingClientRect();
  const pad = 8;
  return {
    position: 'fixed',
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    borderRadius: '16px',
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
    zIndex: 60,
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
  };
}

export default function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const [targetEl, setTargetEl] = useState(null);

  const currentStep = STEPS[step];

  useEffect(() => {
    if (!currentStep) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.target);
      setTargetEl(el);
    }, 100);
    return () => clearTimeout(timer);
  }, [step, currentStep]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  if (!currentStep) return null;

  const tooltipStyle = getTooltipStyle(targetEl);

  return createPortal(
    <div className="fixed inset-0 z-[59]">
      {/* Spotlight */}
      {targetEl && <div style={getSpotlightStyle(targetEl)} />}

      {/* Click catcher */}
      <div className="fixed inset-0 z-[61]" onClick={handleNext} style={{ cursor: 'pointer' }} />

      {/* Tooltip */}
      <div
        className="fixed z-[62] rounded-xl shadow-2xl p-4 max-w-xs bg-white border border-[#FFE5DC]"
        style={{ ...tooltipStyle, pointerEvents: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-[#FF8066] font-semibold mb-1">
          Étape {step + 1}/{STEPS.length}
        </p>
        <h3 className="text-sm font-bold text-slate-800 mb-1">{currentStep.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">{currentStep.text}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Passer le tutoriel
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-1.5 bg-[#FF8066] hover:bg-[#E85D41] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {step < STEPS.length - 1 ? 'Suivant' : 'J\'ai compris'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
