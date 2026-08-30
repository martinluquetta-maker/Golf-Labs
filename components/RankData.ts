/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language, t } from '../utils/translations';

export interface RankTier {
  tier: number; // 1 to 7
  id: string;
  name: string;
  subtitle: string;
  description: string;
  logoDescription: string;
  elementDescription?: string;
  minRP: number;
  maxRP: number;
  gradient: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  glowColor: string;
  textColor: string;
  perks: string[];
  rewardPerWin?: string;
}

export const RANKS_DATA: RankTier[] = [
  {
    tier: 1,
    id: 'rookie_tee',
    name: 'Rookie Tee',
    subtitle: 'Rango 1',
    description: 'Iniciando el camino en el green con tu primer tee tallado a mano.',
    logoDescription: 'Tee de madera con marco de bronce',
    elementDescription: 'Tee de madera con marco de bronce',
    rewardPerWin: '+25 RP / Victoria',
    minRP: 0,
    maxRP: 299,
    gradient: 'from-[#8c5827] via-[#b87333] to-[#cd7f32]',
    accentColor: '#cd7f32',
    borderColor: '#b87333',
    badgeBg: '#3d2514',
    glowColor: 'rgba(205, 127, 50, 0.4)',
    textColor: '#f5d0a9',
    perks: ['Acceso a Partidas Competitivas Online', 'Insignia de Bronce en Perfil']
  },
  {
    tier: 2,
    id: 'iron_strike',
    name: 'Iron Strike',
    subtitle: 'Rango 2',
    description: 'Golpes firmes de hierro templado con precisión táctica.',
    logoDescription: 'Palo de hierro en escudo plateado',
    elementDescription: 'Palo de hierro en escudo plateado',
    rewardPerWin: '+30 RP / Victoria',
    minRP: 300,
    maxRP: 699,
    gradient: 'from-[#475569] via-[#94a3b8] to-[#e2e8f0]',
    accentColor: '#cbd5e1',
    borderColor: '#94a3b8',
    badgeBg: '#1e293b',
    glowColor: 'rgba(203, 213, 225, 0.45)',
    textColor: '#f1f5f9',
    perks: ['Desbloqueo de Emotes en Duelo', 'Insignia de Plata Pulida']
  },
  {
    tier: 3,
    id: 'par_master',
    name: 'Par Master',
    subtitle: 'Rango 3',
    description: 'Estratega del campo con anotaciones impecables y juego seguro.',
    logoDescription: 'Lápiz y tarjeta con detalles en dorado',
    elementDescription: 'Lápiz y tarjeta con detalles en dorado',
    rewardPerWin: '+35 RP / Victoria',
    minRP: 700,
    maxRP: 1199,
    gradient: 'from-[#b45309] via-[#f59e0b] to-[#fde047]',
    accentColor: '#fbbf24',
    borderColor: '#f59e0b',
    badgeBg: '#451a03',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    textColor: '#fef08a',
    perks: ['Multiplicador de Monedas x1.2', 'Marco Dorado en Tablas de Clasificación']
  },
  {
    tier: 4,
    id: 'birdie_hunter',
    name: 'Birdie Hunter',
    subtitle: 'Rango 4',
    description: 'Cazador de hoyos bajo par que domina las trayectorias aéreas.',
    logoDescription: 'Pelota con alas en emblema verde',
    elementDescription: 'Pelota con alas en emblema verde',
    rewardPerWin: '+40 RP / Victoria',
    minRP: 1200,
    maxRP: 1799,
    gradient: 'from-[#064e3b] via-[#10b981] to-[#6ee7b7]',
    accentColor: '#34d399',
    borderColor: '#10b981',
    badgeBg: '#022c22',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    textColor: '#a7f3d0',
    perks: ['Estela Alada Esmeralda', 'Acceso a Torneos Relámpago']
  },
  {
    tier: 5,
    id: 'eagle_precision',
    name: 'Eagle Precision',
    subtitle: 'Rango 5',
    description: 'Visión y puntería de águila majestuosa con tiros legendarios.',
    logoDescription: 'Águila majestuosa sobre fondo azul',
    elementDescription: 'Águila majestuosa sobre fondo azul',
    rewardPerWin: '+45 RP / Victoria',
    minRP: 1800,
    maxRP: 2499,
    gradient: 'from-[#1e3a8a] via-[#3b82f6] to-[#93c5fd]',
    accentColor: '#60a5fa',
    borderColor: '#3b82f6',
    badgeBg: '#0f172a',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    textColor: '#bfdbfe',
    perks: ['Insignia Real de Águila Azul', 'Multiplicador de Monedas x1.5']
  },
  {
    tier: 6,
    id: 'albatross',
    name: 'Albatross',
    subtitle: 'Rango 6',
    description: 'Hazaña mística y milagrosa de los cielos con aura celestial.',
    logoDescription: 'Albatros legendario con aureola violeta',
    elementDescription: 'Albatros legendario con aureola violeta',
    rewardPerWin: '+50 RP / Victoria',
    minRP: 2500,
    maxRP: 3499,
    gradient: 'from-[#4c1d95] via-[#8b5cf6] to-[#e9d5ff]',
    accentColor: '#a78bfa',
    borderColor: '#8b5cf6',
    badgeBg: '#2e1065',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    textColor: '#f3e8ff',
    perks: ['Aura Violeta en Sala de Espera', 'Efecto de Golpe Místico']
  },
  {
    tier: 7,
    id: 'hole_in_one',
    name: 'Hole in One',
    subtitle: 'Rango 7 - Leyenda Suprema',
    description: 'La perfección absoluta del golf. El tiro maestro que corona a los campeones.',
    logoDescription: 'Copa y pelota en hoyo con marco brillante',
    elementDescription: 'Copa y pelota en hoyo con marco brillante',
    rewardPerWin: '+60 RP / Victoria',
    minRP: 3500,
    maxRP: 99999,
    gradient: 'from-[#b45309] via-[#f59e0b] via-[#ec4899] to-[#38bdf8]',
    accentColor: '#facc15',
    borderColor: '#fbbf24',
    badgeBg: '#1f1300',
    glowColor: 'rgba(250, 204, 21, 0.75)',
    textColor: '#ffffff',
    perks: ['Corona y Copa Radiante en Nombre', 'Borde Cósmico Brillante', 'Acceso al Salón de la Fama']
  }
];

export const RANK_TIERS = RANKS_DATA;

export function getRankFromRP(rp: number = 0): RankTier {
  const safeRP = Math.max(0, rp || 0);
  for (let i = RANKS_DATA.length - 1; i >= 0; i--) {
    if (safeRP >= RANKS_DATA[i].minRP) {
      return RANKS_DATA[i];
    }
  }
  return RANKS_DATA[0];
}

export function getNextRank(currentTier: number): RankTier | null {
  if (currentTier >= 7) return null;
  return RANKS_DATA.find(r => r.tier === currentTier + 1) || null;
}

export function getRankProgress(rp: number = 0): {
  currentRank: RankTier;
  nextRank: RankTier | null;
  percentage: number;
  rpIntoTier: number;
  rpRequiredForNext: number;
} {
  const current = getRankFromRP(rp);
  const next = getNextRank(current.tier);

  if (!next) {
    return {
      currentRank: current,
      nextRank: null,
      percentage: 100,
      rpIntoTier: rp - current.minRP,
      rpRequiredForNext: 0
    };
  }

  const range = next.minRP - current.minRP;
  const currentProgress = rp - current.minRP;
  const percentage = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));

  return {
    currentRank: current,
    nextRank: next,
    percentage,
    rpIntoTier: currentProgress,
    rpRequiredForNext: next.minRP - rp
  };
}

export function getLocalizedRankTier(tier: RankTier, lang: Language = 'es'): RankTier {
  const nameKey = `rank_${tier.id}_name` as any;
  const descKey = `rank_${tier.id}_desc` as any;
  const logoKey = `rank_${tier.id}_logo` as any;
  const winRewardText = t('ranks_winReward', lang);

  return {
    ...tier,
    name: t(nameKey, lang, tier.name),
    subtitle: `${t('ranks_tier', lang)} ${tier.tier}`,
    description: t(descKey, lang, tier.description),
    logoDescription: t(logoKey, lang, tier.logoDescription),
    rewardPerWin: tier.rewardPerWin ? `${tier.rewardPerWin.split(' ')[0]} RP ${winRewardText}` : undefined
  };
}

