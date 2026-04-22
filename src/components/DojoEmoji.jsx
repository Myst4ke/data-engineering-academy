/**
 * DojoEmoji — pack d'emojis SVG custom (design file `Emoji Pack`).
 * Style : outline minimaliste type Phosphor/Iconoir + accent coloré rempli.
 * - viewBox 80×80, glyphes optiquement centrés ~48×48 (padding 16)
 * - ink #2B2D42, stroke 2.2, linecap/linejoin round
 * - flat : aucune ombre, aucun shine, aucun dégradé
 * - palette par sémantique : coral (Data), sky (Pipeline), mint (Git/validé),
 *   sun (récompense), rose (bonus)
 *
 * Usage :
 *   import { DojoEmoji, DojoEmojiTile } from './components/DojoEmoji';
 *   <DojoEmoji name="broom" size={48} />
 *   <DojoEmojiTile name="broom" size={64} />
 *
 * Drop-in depuis un emoji natif :
 *   import { NATIVE_TO_KEY, DojoEmoji } from './components/DojoEmoji';
 *   const key = NATIVE_TO_KEY['🧹']; // 'broom'
 */

const INK = '#2B2D42';
const PAPER = '#FFFFFF';
const SW = 2.2;

export const DD = {
  coral: '#FF8066', coralL: '#FFE5DC', coralD: '#E85D41',
  sky:   '#6BA4FF', skyL:   '#DCE8FF', skyD:   '#3B7ADB',
  mint:  '#5ED6B4', mintL:  '#D4F4E9', mintD:  '#0F9B7A',
  sun:   '#FFC857', sunL:   '#FFF2D1', sunD:   '#B88700',
  rose:  '#F472B6', roseL:  '#FCE7F3',
  ink:   INK,      paper:  PAPER,
  border:'#EDE3D2',
};

const S = { stroke: INK, strokeWidth: SW, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
const SFill = (f) => ({ ...S, fill: f });

// ── EMOJI COMPONENTS ─────────────────────────────────────────
// All render inside <svg viewBox="0 0 80 80">, glyph within 16–64 box.

function Broom() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="37" y="12" width="6" height="32" rx="3" {...SFill(DD.coralD)} />
      <path d="M30 44 L50 44 L55 64 L25 64 Z" {...SFill(DD.coral)} />
      <path d="M35 48 L32 60 M40 48 L40 60 M45 48 L48 60" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

function Wrench() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-35 40 40)">
        <rect x="34" y="22" width="12" height="36" rx="2" {...SFill(DD.sky)} />
        <circle cx="40" cy="58" r="12" {...SFill(DD.sky)} />
        <polygon points="34.5,58 37.25,53.23 42.75,53.23 45.5,58 42.75,62.77 37.25,62.77" {...SFill(PAPER)} />
        <path d="M 28 22 A 12 12 0 0 1 33 12.25 Q 33 18 40 18 Q 47 18 47 12.25 A 12 12 0 0 1 52 22 Z" {...SFill(DD.sky)} />
      </g>
    </svg>
  );
}

function BarChart() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 62 L66 62" {...S} />
      <path d="M18 58 L18 62 M62 58 L62 62" {...S} />
      <rect x="22" y="46" width="10" height="16" rx="2.2" {...SFill(PAPER)} />
      <rect x="35" y="34" width="10" height="28" rx="2.2" {...SFill(DD.mint)} />
      <rect x="48" y="24" width="10" height="38" rx="2.2" {...SFill(DD.mintD)} />
    </svg>
  );
}

function Branch() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 58 L40 24" {...S} />
      <path d="M40 32 Q30 29 24 35 Q31 40 40 39 Z" {...SFill(DD.mint)} />
      <path d="M40 42 Q50 39 56 45 Q49 50 40 49 Z" {...SFill(DD.mint)} />
      <path d="M40 52 Q30 49 24 55 Q31 60 40 59 Z" {...SFill(DD.mint)} />
      <path d="M40 24 Q36 19 40 15 Q44 19 40 24 Z" {...SFill(DD.mintD)} />
    </svg>
  );
}

function Mascot() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="28" r="10" {...SFill(PAPER)} />
      <path d="M18 66 Q18 48 32 44 L40 54 L48 44 Q62 48 62 66 Z" {...SFill(PAPER)} />
      <path d="M32 44 L40 54 L48 44" {...S} />
      <rect x="18" y="58" width="44" height="6" rx="2" {...SFill(DD.coral)} />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="24" {...SFill(DD.mint)} />
      <path d="M28 41 L37 50 L53 32" stroke={PAPER} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 38 L28 28 Q28 16 40 16 Q52 16 52 28 L52 38" {...S} />
      <rect x="18" y="38" width="44" height="28" rx="6" {...SFill(DD.sun)} />
      <circle cx="40" cy="50" r="3" fill={INK} />
      <path d="M40 50 L40 58" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Flame() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 12 Q56 26 54 38 Q62 44 60 54 Q58 68 40 68 Q22 68 22 54 Q22 42 32 36 Q32 42 36 42 Q34 28 44 12 Z" {...SFill(DD.coral)} />
      <path d="M44 42 Q48 48 46 54 Q44 60 40 60 Q36 60 36 54 Q36 48 44 42 Z" fill={DD.sun} />
    </svg>
  );
}

function Star() {
  const pts = [];
  const cx = 40, cy = 40;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 24 : 11;
    const a = (-Math.PI / 2) + (i * Math.PI / 5);
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points={pts.join(' ')} {...SFill(DD.sun)} />
    </svg>
  );
}

function Folder() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 24 L34 20 L50 20 L50 24" {...S} />
      <rect x="14" y="24" width="52" height="40" rx="6" {...SFill(DD.sun)} />
      <path d="M14 36 L66 36" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function CsvFile() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 14 L48 14 L60 26 L60 66 Q60 68 58 68 L22 68 Q20 68 20 66 L20 16 Q20 14 22 14 Z" {...SFill(PAPER)} />
      <path d="M48 14 L48 26 L60 26" {...S} />
      <rect x="26" y="42" width="28" height="14" rx="3" fill={DD.coral} />
      <path d="M30 49 L33 49 M37 49 L40 49 M44 49 L47 49 M50 49 L50 49" stroke={PAPER} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Database() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 22 Q18 16 40 16 Q62 16 62 22 L62 58 Q62 64 40 64 Q18 64 18 58 Z" {...SFill(DD.sky)} />
      <ellipse cx="40" cy="22" rx="22" ry="6" fill={PAPER} stroke={INK} strokeWidth={SW} />
      <path d="M18 36 Q18 42 40 42 Q62 42 62 36" {...S} />
    </svg>
  );
}

function Table() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="18" width="52" height="44" rx="6" {...SFill(PAPER)} />
      <path d="M16 20 L64 20 L64 30 L16 30 Z" fill={DD.coral} />
      <rect x="14" y="18" width="52" height="44" rx="6" {...S} />
      <path d="M14 30 L66 30 M14 44 L66 44 M32 30 L32 62 M48 30 L48 62" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

function Filter() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18 L66 18 L48 40 L48 60 L32 66 L32 40 Z" {...SFill(DD.sky)} />
    </svg>
  );
}

function Join() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="40" r="18" {...SFill(DD.sky)} />
      <circle cx="50" cy="40" r="18" {...SFill(DD.coral)} opacity="0.92" />
      <path d="M40 24 A18 18 0 0 1 40 56 A18 18 0 0 1 40 24 Z" fill={DD.rose} opacity="0.85" />
      <circle cx="30" cy="40" r="18" {...S} />
      <circle cx="50" cy="40" r="18" {...S} />
    </svg>
  );
}

function Dedupe() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="24" width="28" height="36" rx="5" {...SFill(DD.coralL)} transform="rotate(-8 32 42)" />
      <rect x="34" y="20" width="28" height="36" rx="5" {...SFill(DD.coral)} transform="rotate(8 48 38)" />
      <circle cx="60" cy="58" r="11" {...SFill(DD.rose)} />
      <path d="M55 53 L65 63 M65 53 L55 63" stroke={PAPER} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function Bolt() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 10 L22 44 L36 44 L32 70 L58 34 L42 34 Z" {...SFill(DD.sun)} />
    </svg>
  );
}

function Target() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="26" {...SFill(PAPER)} />
      <circle cx="40" cy="40" r="18" {...SFill(DD.coralL)} />
      <circle cx="40" cy="40" r="9" {...SFill(DD.coral)} />
      <circle cx="40" cy="40" r="2.5" fill={INK} />
    </svg>
  );
}

function Save() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 18 L54 18 L66 30 L66 62 Q66 66 62 66 L18 66 Q14 66 14 62 L14 22 Q14 18 18 18 Z" {...SFill(DD.sky)} />
      <rect x="24" y="18" width="28" height="12" rx="1.5" fill={PAPER} stroke={INK} strokeWidth={SW} />
      <rect x="44" y="21" width="4" height="6" rx="1" fill={INK} />
      <rect x="24" y="44" width="32" height="18" rx="2" fill={PAPER} stroke={INK} strokeWidth={SW} />
    </svg>
  );
}

function Puzzle() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 22 Q16 18 20 18 L34 18 Q34 10 40 10 Q46 10 46 18 L60 18 Q64 18 64 22 L64 36 Q72 36 72 42 Q72 48 64 48 L64 62 Q64 66 60 66 L46 66 Q46 58 40 58 Q34 58 34 66 L20 66 Q16 66 16 62 L16 48 Q24 48 24 42 Q24 36 16 36 Z" {...SFill(DD.rose)} />
    </svg>
  );
}

function Flask() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M34 14 L46 14" {...S} />
      <path d="M34 14 L34 32 L20 60 Q18 66 24 66 L56 66 Q62 66 60 60 L46 32 L46 14" {...SFill(PAPER)} />
      <path d="M28 44 L52 44 L60 60 Q62 66 56 66 L24 66 Q18 66 20 60 Z" fill={DD.mint} />
      <circle cx="34" cy="54" r="2" fill={PAPER} />
      <circle cx="44" cy="58" r="1.5" fill={PAPER} />
    </svg>
  );
}

function Trophy() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 22 Q14 22 14 32 Q14 40 24 42" {...S} />
      <path d="M56 22 Q66 22 66 32 Q66 40 56 42" {...S} />
      <path d="M22 16 L58 16 L56 38 Q56 50 40 50 Q24 50 24 38 Z" {...SFill(DD.sun)} />
      <path d="M40 50 L40 58" {...S} />
      <rect x="28" y="58" width="24" height="7" rx="2" {...SFill(DD.sunD)} />
    </svg>
  );
}

function Sparkles() {
  const sparkle = (cx, cy, r) =>
    `M${cx} ${cy - r} Q${cx + r * 0.3} ${cy - r * 0.3} ${cx + r} ${cy} Q${cx + r * 0.3} ${cy + r * 0.3} ${cx} ${cy + r} Q${cx - r * 0.3} ${cy + r * 0.3} ${cx - r} ${cy} Q${cx - r * 0.3} ${cy - r * 0.3} ${cx} ${cy - r} Z`;
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d={sparkle(40, 40, 20)} {...SFill(DD.rose)} />
      <path d={sparkle(62, 20, 8)} {...SFill(DD.rose)} />
      <path d={sparkle(18, 62, 6)} {...SFill(DD.rose)} />
    </svg>
  );
}

function Sort() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 22 L56 22" {...S} />
      <path d="M16 36 L46 36" {...S} />
      <path d="M16 50 L34 50" {...S} />
      <path d="M60 18 L60 62" stroke={DD.coralD} strokeWidth={SW} strokeLinecap="round" fill="none" />
      <path d="M52 54 L60 62 L68 54" {...SFill(DD.coral)} />
    </svg>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 16 L18 62 L66 62" {...S} />
      <path d="M22 52 L32 44 L42 50 L52 32 L62 24" stroke={DD.mintD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="62" cy="24" r="4" {...SFill(DD.mint)} />
    </svg>
  );
}

function PieChart() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="24" {...SFill(PAPER)} />
      <path d="M40 40 L40 16 A24 24 0 0 1 60.78 52 Z" fill={DD.mint} />
      <circle cx="40" cy="40" r="24" {...S} />
      <path d="M40 40 L40 16 M40 40 L60.78 52" {...S} />
    </svg>
  );
}

function LinkIco() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-35 40 40)">
        <rect x="10" y="32" width="34" height="16" rx="8" {...SFill(DD.sky)} />
        <rect x="36" y="32" width="34" height="16" rx="8" {...SFill(PAPER)} />
        <path d="M30 40 L50 40" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
      </g>
    </svg>
  );
}

function Brain() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 20 Q32 14 24 20 Q14 22 16 34 Q10 40 16 48 Q14 58 24 62 Q32 68 40 62 Z" {...SFill(DD.rose)} />
      <path d="M40 20 Q48 14 56 20 Q66 22 64 34 Q70 40 64 48 Q66 58 56 62 Q48 68 40 62 Z" {...SFill(DD.rose)} />
      <path d="M40 20 L40 62" stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M28 30 Q32 34 28 38 M52 30 Q48 34 52 38 M28 46 Q32 50 28 54 M52 46 Q48 50 52 54" stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

// ── V2 COMPONENTS ────────────────────────────────────────────

function Api() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="24" {...SFill(DD.sky)} />
      <ellipse cx="40" cy="40" rx="10" ry="24" {...S} stroke={PAPER} strokeWidth="2" />
      <ellipse cx="40" cy="40" rx="24" ry="10" {...S} stroke={PAPER} strokeWidth="2" />
      <path d="M16 40 L64 40" stroke={PAPER} strokeWidth="2" strokeLinecap="round" />
      <path d="M40 16 L40 64" stroke={PAPER} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Concat() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="14" width="44" height="14" rx="3" {...SFill(DD.sky)} />
      <rect x="18" y="32" width="44" height="14" rx="3" {...SFill(DD.skyL)} />
      <path d="M40 52 L40 64 M32 58 L40 66 L48 58" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Trash() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="22" width="52" height="6" rx="3" {...SFill(DD.rose)} />
      <rect x="32" y="16" width="16" height="6" rx="2" {...SFill(DD.rose)} />
      <path d="M20 30 L60 30 L56 66 Q56 68 54 68 L26 68 Q24 68 24 66 Z" {...SFill(DD.roseL)} />
      <path d="M32 38 L32 60 M40 38 L40 60 M48 38 L48 60" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Pencil() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-35 40 40)">
        <rect x="18" y="34" width="36" height="12" {...SFill(DD.sun)} />
        <rect x="12" y="34" width="8" height="12" rx="1.5" {...SFill(DD.rose)} />
        <rect x="20" y="34" width="4" height="12" fill={INK} opacity="0.15" stroke={INK} strokeWidth={SW} />
        <path d="M54 34 L66 40 L54 46 Z" {...SFill(PAPER)} />
        <path d="M62 38 L66 40 L62 42 Z" fill={INK} />
      </g>
    </svg>
  );
}

function Cycle() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.09 33.84 A18 18 0 0 1 56.91 33.84" stroke={DD.mintD} strokeWidth="4.6" strokeLinecap="round" fill="none" />
      <path d="M59.65 41.36 L53.15 35.21 L60.67 32.47 Z" fill={DD.mintD} />
      <path d="M56.91 46.16 A18 18 0 0 1 23.09 46.16" stroke={DD.mint} strokeWidth="4.6" strokeLinecap="round" fill="none" />
      <path d="M20.35 38.64 L26.85 44.79 L19.33 47.53 Z" fill={DD.mint} />
    </svg>
  );
}

function MapIco() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 22 L30 16 L50 22 L66 16 L66 58 L50 64 L30 58 L14 64 Z" {...SFill(DD.mintL)} />
      <path d="M30 16 L30 58 M50 22 L50 64" {...S} />
      <path d="M40 30 Q34 30 34 38 Q34 44 40 50 Q46 44 46 38 Q46 30 40 30 Z" {...SFill(DD.coral)} />
      <circle cx="40" cy="38" r="3" fill={PAPER} />
    </svg>
  );
}

function WindowIco() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 60 L66 60" {...S} />
      <rect x="18" y="48" width="6" height="12" rx="1" {...SFill(DD.skyL)} />
      <rect x="26" y="42" width="6" height="18" rx="1" fill={DD.sky} stroke={INK} strokeWidth={SW} />
      <rect x="34" y="36" width="6" height="24" rx="1" fill={DD.sky} stroke={INK} strokeWidth={SW} />
      <rect x="42" y="44" width="6" height="16" rx="1" fill={DD.sky} stroke={INK} strokeWidth={SW} />
      <rect x="50" y="40" width="6" height="20" rx="1" {...SFill(DD.skyL)} />
      <rect x="58" y="50" width="6" height="10" rx="1" {...SFill(DD.skyL)} />
      <rect x="24" y="30" width="26" height="36" rx="3" fill="none" stroke={DD.coralD} strokeWidth="2.4" strokeDasharray="4 3" />
    </svg>
  );
}

function Dice() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-8 40 40)">
        <rect x="16" y="16" width="48" height="48" rx="10" {...SFill(DD.sun)} />
        <circle cx="28" cy="28" r="3.4" fill={INK} />
        <circle cx="52" cy="28" r="3.4" fill={INK} />
        <circle cx="40" cy="40" r="3.4" fill={INK} />
        <circle cx="28" cy="52" r="3.4" fill={INK} />
        <circle cx="52" cy="52" r="3.4" fill={INK} />
      </g>
    </svg>
  );
}

function Loop() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M35.34 22.61 A18 18 0 1 0 44.66 22.61" stroke={DD.sky} strokeWidth="4.6" strokeLinecap="round" fill="none" />
      <path d="M52.39 24.68 L43.75 25.99 L45.57 19.23 Z" fill={DD.skyD} />
    </svg>
  );
}

function Note() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 14 L50 14 L60 24 L60 66 Q60 68 58 68 L22 68 Q20 68 20 66 L20 16 Q20 14 22 14 Z" {...SFill(PAPER)} />
      <path d="M50 14 L50 24 L60 24" {...S} />
      <path d="M27 34 L50 34 M27 44 L50 44 M27 54 L44 54" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.25" />
      <path d="M32 34 L52 34 Q58 34 58 39 Q58 44 52 44 L30 44 Q24 44 24 49 Q24 54 30 54 L48 54" stroke={DD.coralD} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M44 50 L52 54 L44 58 Z" fill={DD.coralD} stroke={DD.coralD} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function Search() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="34" cy="34" r="18" {...SFill(DD.skyL)} />
      <path d="M47 47 L62 62" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M47 47 L62 62" stroke={DD.sky} strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="34" cy="34" r="10" fill="none" stroke={INK} strokeWidth="1.8" />
    </svg>
  );
}

function Warehouse() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 30 L40 16 L68 30 L68 36 L12 36 Z" {...SFill(DD.skyD)} />
      <rect x="14" y="36" width="52" height="30" {...SFill(DD.sky)} />
      <path d="M12 66 L68 66" {...S} />
      <rect x="22" y="44" width="10" height="14" rx="1" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <rect x="36" y="44" width="10" height="14" rx="1" fill={PAPER} stroke={INK} strokeWidth="1.6" />
      <rect x="50" y="44" width="10" height="14" rx="1" fill={PAPER} stroke={INK} strokeWidth="1.6" />
    </svg>
  );
}

function Gear() {
  const teeth = 8;
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i * Math.PI) / teeth - Math.PI / 2;
    const r = i % 2 === 0 ? 26 : 20;
    pts.push(`${40 + r * Math.cos(a)},${40 + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points={pts.join(' ')} {...SFill(DD.sun)} />
      <circle cx="40" cy="40" r="9" {...SFill(PAPER)} />
    </svg>
  );
}

function FileBox() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="26" width="52" height="40" rx="4" {...SFill(DD.sun)} />
      <rect x="14" y="26" width="52" height="10" {...SFill(DD.sunD)} />
      <rect x="33" y="30" width="14" height="4" rx="2" fill={INK} opacity="0.6" />
      <rect x="22" y="20" width="12" height="8" rx="1.5" {...SFill(PAPER)} />
      <rect x="38" y="18" width="12" height="10" rx="1.5" {...SFill(PAPER)} />
      <rect x="54" y="22" width="10" height="6" rx="1.5" {...SFill(PAPER)} />
    </svg>
  );
}

function Medal({ color, colorDark, label }) {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 12 L34 42 L20 32 Z" {...SFill(DD.sky)} />
      <path d="M54 12 L46 42 L60 32 Z" {...SFill(DD.coral)} />
      <circle cx="40" cy="52" r="16" fill={color} stroke={INK} strokeWidth={SW} />
      <circle cx="40" cy="52" r="11" fill="none" stroke={colorDark} strokeWidth="1.6" />
      <text x="40" y="58" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="700" fontSize="18" fill={colorDark}>{label}</text>
    </svg>
  );
}
function Bronze() { return <Medal color="#C97B4E" colorDark="#8B4F24" label="3" />; }
function Silver() { return <Medal color="#B8BEC9" colorDark="#6B7280" label="2" />; }
function Gold()   { return <Medal color="#E9B931" colorDark="#B88700" label="1" />; }

function Kpi() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="18" width="56" height="44" rx="6" {...SFill(PAPER)} />
      <path d="M12 28 L68 28" {...S} />
      <circle cx="18" cy="23" r="1.6" fill={INK} opacity="0.4" />
      <circle cx="24" cy="23" r="1.6" fill={INK} opacity="0.4" />
      <text x="40" y="53" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="700" fontSize="22" fill={DD.mintD}>42K</text>
    </svg>
  );
}

function Scatter() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 16 L16 62 L66 62" {...S} />
      {[
        [24,54],[34,46],[30,38],[42,40],[50,32],[44,28],[58,26],[62,38],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" {...SFill(DD.rose)} />
      ))}
    </svg>
  );
}

function Treemap() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="16" width="52" height="48" rx="3" {...SFill(PAPER)} />
      <rect x="14" y="16" width="30" height="30" fill={DD.mint} />
      <rect x="44" y="16" width="22" height="18" fill={DD.mintL} />
      <rect x="44" y="34" width="12" height="12" fill={DD.coral} />
      <rect x="56" y="34" width="10" height="12" fill={DD.sun} />
      <rect x="14" y="46" width="20" height="18" fill={DD.sky} />
      <rect x="34" y="46" width="32" height="18" fill={DD.skyL} />
      <rect x="14" y="16" width="52" height="48" rx="3" {...S} />
      <path d="M14 46 L66 46 M34 46 L34 64 M44 16 L44 34 M56 34 L56 46 M44 34 L66 34" {...S} strokeWidth="1.6" />
    </svg>
  );
}

function Funnel() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 18 L66 18 L58 32 L22 32 Z" {...SFill(DD.sky)} />
      <path d="M22 34 L58 34 L52 48 L28 48 Z" {...SFill(DD.coral)} />
      <path d="M28 50 L52 50 L46 64 L34 64 Z" {...SFill(DD.mint)} />
    </svg>
  );
}

function Slicer() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="36" width="60" height="10" rx="5" {...SFill(DD.skyL)} />
      <rect x="10" y="36" width="32" height="10" rx="5" fill={DD.sky} />
      <circle cx="42" cy="41" r="10" fill={PAPER} stroke={INK} strokeWidth={SW} />
      <circle cx="42" cy="41" r="4" fill={DD.sky} />
    </svg>
  );
}

function Separator() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="36" width="52" height="8" rx="4" {...SFill(DD.coralL)} />
      <circle cx="20" cy="40" r="2" fill={DD.coralD} />
      <circle cx="40" cy="40" r="2" fill={DD.coralD} />
      <circle cx="60" cy="40" r="2" fill={DD.coralD} />
    </svg>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30 L30 16 L50 16 L60 30 L40 64 Z" {...SFill(DD.sky)} />
      <path d="M20 30 L60 30 M30 16 L40 30 L50 16 M40 30 L40 64" {...S} strokeWidth="1.8" stroke={PAPER} />
      <path d="M20 30 L60 30" {...S} />
    </svg>
  );
}

function StarEmpty() {
  const pts = [];
  const cx = 40, cy = 40;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 24 : 11;
    const a = (-Math.PI / 2) + (i * Math.PI / 5);
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points={pts.join(' ')} fill={DD.sunL} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    </svg>
  );
}

function Info() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="24" {...SFill(DD.sky)} />
      <circle cx="40" cy="28" r="3.2" fill={PAPER} />
      <rect x="36" y="36" width="8" height="20" rx="3" fill={PAPER} />
    </svg>
  );
}

function Warn() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 14 L70 64 L10 64 Z" {...SFill(DD.sun)} strokeLinejoin="round" />
      <rect x="37" y="30" width="6" height="18" rx="3" fill={INK} />
      <circle cx="40" cy="56" r="3" fill={INK} />
    </svg>
  );
}

function ErrorIco() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="24" {...SFill(DD.rose)} />
      <path d="M30 30 L50 50 M50 30 L30 50" stroke={PAPER} strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function Office() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="22" width="36" height="44" rx="2" {...SFill(DD.sky)} />
      <rect x="50" y="34" width="18" height="32" rx="2" {...SFill(DD.skyD)} />
      {[[19,28],[29,28],[39,28],[19,40],[29,40],[39,40],[19,52],[29,52],[39,52]].map(([x,y],i)=>(
        <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill={PAPER} />
      ))}
      {[[55,40],[62,40],[55,50],[62,50]].map(([x,y],i)=>(
        <rect key={`r${i}`} x={x} y={y} width="4" height="4" rx="1" fill={PAPER} opacity="0.85" />
      ))}
      <path d="M10 66 L70 66" {...S} />
    </svg>
  );
}

function Inbox() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 38 L26 18 L54 18 L66 38 L66 60 Q66 64 62 64 L18 64 Q14 64 14 60 Z" {...SFill(DD.skyL)} />
      <path d="M14 38 L28 38 Q30 38 30 40 Q30 46 40 46 Q50 46 50 40 Q50 38 52 38 L66 38" {...S} fill={DD.sky} />
      <path d="M40 14 L40 30 M34 24 L40 30 L46 24" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Outbox() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 38 L26 18 L54 18 L66 38 L66 60 Q66 64 62 64 L18 64 Q14 64 14 60 Z" {...SFill(DD.coralL)} />
      <path d="M14 38 L28 38 Q30 38 30 40 Q30 46 40 46 Q50 46 50 40 Q50 38 52 38 L66 38" {...S} fill={DD.coral} />
      <path d="M40 30 L40 14 M34 20 L40 14 L46 20" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PlayingCard() {
  return (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="22" y="14" width="36" height="52" rx="5" {...SFill(DD.coralL)} transform="rotate(-8 40 40)" />
      <rect x="22" y="14" width="36" height="52" rx="5" {...SFill(PAPER)} transform="rotate(6 40 40)" />
      <g transform="rotate(6 40 40)">
        <text x="28" y="26" fontFamily="Fraunces, serif" fontWeight="700" fontSize="11" fill={DD.coralD}>A</text>
        <path d="M40 32 Q32 38 34 46 Q36 52 40 52 Q44 52 46 46 Q48 38 40 32 Z" fill={DD.coralD} />
        <text x="50" y="52" fontFamily="Fraunces, serif" fontWeight="700" fontSize="11" fill={DD.coralD} transform="rotate(180 50 52)">A</text>
      </g>
    </svg>
  );
}

// ── REGISTRY ─────────────────────────────────────────────────
export const EMOJI_COMPONENTS = {
  broom:     { C: Broom,     label: 'Broom',     fr: 'Balai',             use: 'Data Dojo · nettoyage',    replaces: '🧹',  tile: 'coral' },
  wrench:    { C: Wrench,    label: 'Wrench',    fr: 'Clé',               use: 'Pipeline Dojo · ETL',       replaces: '🔧',  tile: 'sky'   },
  barChart:  { C: BarChart,  label: 'Bars',      fr: 'Graphique',         use: 'BI Dojo · dashboards',      replaces: '📊',  tile: 'mint'  },
  branch:    { C: Branch,    label: 'Branch',    fr: 'Branche',           use: 'Git Dojo · branches',       replaces: '🌿',  tile: 'mint'  },
  mascot:    { C: Mascot,    label: 'Mascot',    fr: 'Mascotte',          use: 'Avatar / apprenant',        replaces: '🥋',  tile: 'coral' },
  check:     { C: Check,     label: 'Check',     fr: 'Validé',            use: 'Exercice complété',         replaces: '✅',  tile: 'mint'  },
  lock:      { C: Lock,      label: 'Lock',      fr: 'Verrouillé',        use: 'Niveau bloqué',             replaces: '🔒',  tile: 'sun'   },
  flame:     { C: Flame,     label: 'Flame',     fr: 'Série',             use: 'Streak quotidien',          replaces: '🔥',  tile: 'coral' },
  star:      { C: Star,      label: 'Star',      fr: 'Étoile',            use: 'Note / tier',               replaces: '⭐',  tile: 'sun'   },
  folder:    { C: Folder,    label: 'Folder',    fr: 'Dossier',           use: 'Jeu de données',            replaces: '📁',  tile: 'sun'   },
  csv:       { C: CsvFile,   label: 'CSV',       fr: 'Fichier CSV',       use: 'Fichier source',            replaces: '📄',  tile: 'coral' },
  database:  { C: Database,  label: 'DB',        fr: 'Base de données',   use: 'Source SQL',                replaces: '🗄️', tile: 'sky'   },
  table:     { C: Table,     label: 'Table',     fr: 'Tableau',           use: "Table d'entrée",            replaces: '📋',  tile: 'coral' },
  filter:    { C: Filter,    label: 'Filter',    fr: 'Filtre',            use: 'Transformation',            replaces: '🔍',  tile: 'sky'   },
  join:      { C: Join,      label: 'Join',      fr: 'Jointure',          use: 'Fusion de tables',          replaces: '🔀',  tile: 'rose'  },
  dedupe:    { C: Dedupe,    label: 'Dedupe',    fr: 'Doublons',          use: 'Supprimer doublons',        replaces: '✂️',  tile: 'coral' },
  bolt:      { C: Bolt,      label: 'Bolt',      fr: 'Transformer',       use: 'Action rapide',             replaces: '⚡',  tile: 'sun'   },
  target:    { C: Target,    label: 'Target',    fr: 'Objectif',          use: "But d'exercice",            replaces: '🎯',  tile: 'coral' },
  save:      { C: Save,      label: 'Save',      fr: 'Sauvegarder',       use: 'Destination',               replaces: '💾',  tile: 'sky'   },
  puzzle:    { C: Puzzle,    label: 'Puzzle',    fr: 'Défi',              use: 'Exercice complexe',         replaces: '🧩',  tile: 'rose'  },
  flask:     { C: Flask,     label: 'Flask',     fr: 'Bac à sable',       use: 'Mode libre',                replaces: '🧪',  tile: 'mint'  },
  trophy:    { C: Trophy,    label: 'Trophy',    fr: 'Trophée',           use: 'Victoire',                  replaces: '🏆',  tile: 'sun'   },
  sparkles:  { C: Sparkles,  label: 'Sparkles',  fr: 'Étincelles',        use: 'Bonus / récompense',        replaces: '✨',  tile: 'rose'  },
  sort:      { C: Sort,      label: 'Sort',      fr: 'Trier',             use: 'Transformation',            replaces: '↕️',  tile: 'coral' },
  lineChart: { C: LineChart, label: 'Trend',     fr: 'Tendance',          use: 'Métrique temporelle',       replaces: '📈',  tile: 'mint'  },
  pieChart:  { C: PieChart,  label: 'Pie',       fr: 'Répartition',       use: 'Dashboard KPI',             replaces: '🥧',  tile: 'mint'  },
  link:      { C: LinkIco,   label: 'Link',      fr: 'Lien',              use: 'Relation / FK',             replaces: '🔗',  tile: 'sky'   },
  brain:     { C: Brain,     label: 'Apprendre', fr: 'Savoir',            use: 'Niveau / connaissance',     replaces: '🧠',  tile: 'rose'  },

  // v2 — Pipeline
  api:       { C: Api,       label: 'API',       fr: 'API REST',          use: 'Source externe',            replaces: '🌐',  tile: 'sky'   },
  concat:    { C: Concat,    label: 'Concat',    fr: 'Concaténer',        use: 'Empiler deux tables',       replaces: '⬇️',  tile: 'sky'   },
  trash:     { C: Trash,     label: 'Trash',     fr: 'Supprimer',         use: 'Supprimer colonne',         replaces: '🗑️',  tile: 'rose'  },
  pencil:    { C: Pencil,    label: 'Pencil',    fr: 'Renommer',          use: 'Renommer colonne',          replaces: '✏️',  tile: 'sun'   },
  cycle:     { C: Cycle,     label: 'Cycle',     fr: 'Dédoublonner',      use: 'Logic / unique',            replaces: '🔄',  tile: 'mint'  },
  mapIco:    { C: MapIco,    label: 'Map',       fr: 'Mapping',           use: 'Correspondance géo',        replaces: '🗺️',  tile: 'mint'  },
  windowFn:  { C: WindowIco, label: 'Window',    fr: 'Fenêtre',           use: 'Window function',           replaces: '📐',  tile: 'sky'   },
  dice:      { C: Dice,      label: 'Dice',      fr: 'Échantillon',       use: 'Sampling aléatoire',        replaces: '🎲',  tile: 'sun'   },
  loop:      { C: Loop,      label: 'Loop',      fr: 'Boucle',            use: 'ForEach',                   replaces: '🔁',  tile: 'sky'   },
  note:      { C: Note,      label: 'Note',      fr: 'Lignes',            use: 'ForEachRow / texte BI',     replaces: '📝',  tile: 'coral' },
  search:    { C: Search,    label: 'Search',    fr: 'Recherche',         use: 'Lookup / exists',           replaces: '🔎',  tile: 'sky'   },
  warehouse: { C: Warehouse, label: 'DWH',       fr: 'Entrepôt',          use: 'Data Warehouse',            replaces: '🏭',  tile: 'sky'   },
  gear:      { C: Gear,      label: 'Gear',      fr: 'Transformer',       use: 'Catégorie transformations', replaces: '⚙️',  tile: 'sun'   },
  fileBox:   { C: FileBox,   label: 'Box',       fr: 'Archive',           use: 'Stockage / Medallion',      replaces: '🗃️',  tile: 'sun'   },

  // v2 — Lakehouse tiers
  bronze:    { C: Bronze,    label: 'Bronze',    fr: 'Bronze',            use: 'Tier Bronze',               replaces: '🥉',  tile: 'coral' },
  silver:    { C: Silver,    label: 'Silver',    fr: 'Argent',            use: 'Tier Silver',               replaces: '🥈',  tile: 'sky'   },
  gold:      { C: Gold,      label: 'Gold',      fr: 'Or',                use: 'Tier Gold',                 replaces: '🥇',  tile: 'sun'   },

  // v2 — BI widgets
  kpi:       { C: Kpi,       label: 'KPI',       fr: 'KPI',               use: 'Indicateur chiffré',        replaces: '🔢',  tile: 'mint'  },
  scatter:   { C: Scatter,   label: 'Scatter',   fr: 'Nuage',             use: 'Nuage de points',           replaces: '⚬',   tile: 'rose'  },
  treemap:   { C: Treemap,   label: 'Treemap',   fr: 'Arborescence',      use: 'Répartition proportionnelle', replaces: '🟩', tile: 'mint' },
  funnel:    { C: Funnel,    label: 'Funnel',    fr: 'Entonnoir',         use: 'Conversion par étape',      replaces: '🔻',  tile: 'coral' },
  slicer:    { C: Slicer,    label: 'Slicer',    fr: 'Slicer',            use: 'Filtre interactif',         replaces: '🔘',  tile: 'sky'   },
  separator: { C: Separator, label: 'Sep.',      fr: 'Séparateur',        use: 'Divider layout',            replaces: '➖',  tile: 'coral' },

  // v2 — Statuses
  diamond:   { C: Diamond,   label: 'Diamond',   fr: 'Diamant',           use: 'Tier Expert',               replaces: '💎',  tile: 'sky'   },
  starEmpty: { C: StarEmpty, label: 'Empty',     fr: 'Étoile vide',       use: 'Étoile non-gagnée',         replaces: '☆',   tile: 'sun'   },
  info:      { C: Info,      label: 'Info',      fr: 'Info',              use: 'Log INFO',                  replaces: 'ℹ️',  tile: 'sky'   },
  warn:      { C: Warn,      label: 'Attention', fr: 'Attention',         use: 'Log WARN',                  replaces: '⚠️',  tile: 'sun'   },
  errorIco:  { C: ErrorIco,  label: 'Error',     fr: 'Erreur',            use: 'Log ERROR',                 replaces: '❌',  tile: 'rose'  },

  // v2 — Dojo Intro
  office:    { C: Office,    label: 'Office',    fr: 'Immeuble',          use: 'Dans le monde réel',        replaces: '🏢',  tile: 'sky'   },
  card:      { C: PlayingCard, label: 'Card',    fr: 'Carte',             use: 'Comment ça marche',         replaces: '🃏',  tile: 'coral' },

  // v2 — Pipeline categories
  inbox:     { C: Inbox,     label: 'Inbox',     fr: 'Entrée',            use: 'Catégorie Sources',         replaces: '📥',  tile: 'sky'   },
  outbox:    { C: Outbox,    label: 'Outbox',    fr: 'Sortie',            use: 'Catégorie Destinations',    replaces: '📤',  tile: 'coral' },
};

// Normalisation FE0F pour que '↕' (sans sélecteur) matche '↕️' (avec sélecteur)
const stripFe0f = (s) => (s ? s.replace(/\ufe0f/g, '') : s);

// Reverse-lookup : emoji natif → clé de registre ('🧹' → 'broom').
// On indexe chaque emoji deux fois : avec et sans FE0F pour matcher les deux formes.
export const NATIVE_TO_KEY = Object.entries(EMOJI_COMPONENTS).reduce((acc, [key, v]) => {
  if (!v.replaces) return acc;
  acc[v.replaces] = key;
  acc[stripFe0f(v.replaces)] = key;
  return acc;
}, {});

const TILE_BG = {
  coral: DD.coralL,
  sky:   DD.skyL,
  mint:  DD.mintL,
  sun:   DD.sunL,
  rose:  DD.roseL,
};

export function DojoEmoji({ name, size = 48, className = '', style = {} }) {
  const entry = EMOJI_COMPONENTS[name];
  if (!entry) return null;
  const Icon = entry.C;
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', width: size, height: size, lineHeight: 0, ...style }}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}

export function DojoEmojiTile({ name, size = 64, tile, className = '', style = {} }) {
  const entry = EMOJI_COMPONENTS[name];
  if (!entry) return null;
  const bg = TILE_BG[tile || entry.tile] || TILE_BG.coral;
  const inner = Math.round(size * 0.78);
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.08)',
        ...style,
      }}
      aria-hidden="true"
    >
      <DojoEmoji name={name} size={inner} />
    </span>
  );
}

/**
 * Auto-variant : accepte un emoji natif et rend la version Dojo si elle existe,
 * sinon retombe sur le glyphe natif (text).
 *   <DojoEmojiAuto native="🧹" size={32} />
 */
export function DojoEmojiAuto({ native, size = 32, fallback = true }) {
  const key = NATIVE_TO_KEY[native] || NATIVE_TO_KEY[stripFe0f(native)];
  if (key) return <DojoEmoji name={key} size={size} />;
  if (!fallback) return null;
  return <span style={{ fontSize: size }} aria-hidden="true">{native}</span>;
}

export default DojoEmoji;
