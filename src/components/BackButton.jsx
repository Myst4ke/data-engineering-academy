import { ArrowLeft } from 'lucide-react';

/**
 * Bouton de retour unifié pour tous les écrans.
 * Par défaut libellé "Accueil" ; customisable via props.
 */
export default function BackButton({ onClick, label = 'Accueil', size = 'md', ariaLabel, className = '' }) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={`game-btn ${sizeClasses[size] || sizeClasses.md} font-semibold flex items-center gap-1.5 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
