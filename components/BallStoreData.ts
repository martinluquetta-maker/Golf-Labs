/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BallItem {
  id: string;
  name: string;
  type: 'real' | 'extra';
  price: number;
  description: string;
  color: string; // Primary circle fill color
  secondaryColor?: string; // Secondary details/markings fill
  textColor?: string;
  glowColor?: string; // Shadow/glow color on canvas
  hasStripe?: boolean; // Guide line or stripe
  hasDualRing?: boolean; // TP5 style dual line ring
  hasTruvis?: boolean; // Soccer style pentagons
  hasNumberOne?: boolean; // Classic Pro red '1' mark
  isGoldMetallic?: boolean;
  is8Ball?: boolean;
  isDonut?: boolean;
  isFireball?: boolean;
  isCosmic?: boolean;
  isSlime?: boolean;
}

export const BALLS_STORE_ITEMS: BallItem[] = [
  {
    id: 'classic_white',
    name: 'Classic White',
    type: 'real',
    price: 0,
    description: 'Your trustworthy standard-dimple white golf ball.',
    color: '#ffffff',
    secondaryColor: '#e0e0e0',
    textColor: '#3d312a',
  },
  {
    id: 'range_ball',
    name: 'Practice Range Ball',
    type: 'real',
    price: 80,
    description: 'A rugged club practice ball sporting a prominent black running stripe.',
    color: '#fcfcfc',
    secondaryColor: '#1d1916',
    hasStripe: true,
  },
  {
    id: 'prov1',
    name: 'Pro V1 Red Tag',
    type: 'real',
    price: 150,
    description: 'The iconic premium distance ball. Features a thin alignment arrow and small red "1".',
    color: '#ffffff',
    secondaryColor: '#db5641',
    hasNumberOne: true,
  },
  {
    id: 'zstar_yellow',
    name: 'Z-Star fluorescent',
    type: 'real',
    price: 200,
    description: 'Highly visible fluorescent tour yellow shell with a dark alignment stamp.',
    color: '#e2f73b',
    secondaryColor: '#303030',
    textColor: '#1a2012',
    hasStripe: true,
  },
  {
    id: 'tp5_rings',
    name: 'Taylor TP5 Alignment',
    type: 'real',
    price: 250,
    description: 'Advanced tour ball sporting dual orange-black target-ring lines matching professional standards.',
    color: '#ffffff',
    secondaryColor: '#e35112',
    hasDualRing: true,
  },
  {
    id: 'truvis_soccer',
    name: 'Chrome Soft Truvis',
    type: 'real',
    price: 320,
    description: 'Classic red-and-white truvis soccer geometry. Excellent for rotation feedback and style.',
    color: '#ffffff',
    secondaryColor: '#db5641',
    hasTruvis: true,
  },
  {
    id: 'solid_gold',
    name: 'The Midas Master',
    type: 'extra',
    price: 750,
    description: 'Forged in pure 24K gold with deep polished amber shading, sparkling particle halos, and luxury.',
    color: '#ffd700',
    secondaryColor: '#d4af37',
    glowColor: 'rgba(255, 215, 0, 0.7)',
    isGoldMetallic: true,
  },
  {
    id: 'retro_8ball',
    name: 'Classic Billiards 8-Ball',
    type: 'extra',
    price: 300,
    description: 'The retro shiny solid-black billiard ball with a clean white circle labeled with the number "8".',
    color: '#1a1a1a',
    secondaryColor: '#ffffff',
    textColor: '#1a1a1a',
    is8Ball: true,
  },
  {
    id: 'lava_fireball',
    name: 'Cosmic Fireball',
    type: 'extra',
    price: 550,
    description: 'Raging lava core with flickering solar-flare halos. Ignites the green with fiery red embers!',
    color: '#ff4500',
    secondaryColor: '#ffcc00',
    glowColor: 'rgba(255, 69, 0, 0.8)',
    isFireball: true,
  },
  {
    id: 'slime_ball',
    name: 'Slime Goo-Ball',
    type: 'extra',
    price: 400,
    description: 'Bouncy translucent ectoplasmic bubble that leaves a vibrant trail. Squishy physics feel!',
    color: '#39ff14',
    secondaryColor: '#13da1c',
    glowColor: 'rgba(57, 255, 20, 0.65)',
    isSlime: true,
  },
  {
    id: 'pink_donut',
    name: 'Glazed Strawberry Donut',
    type: 'extra',
    price: 450,
    description: 'Freshly baked ball glazed with sweet strawberry frosting and topped with colorful fun sprinkles.',
    color: '#ffb5d8',
    secondaryColor: '#8a4f1d',
    isDonut: true,
  },
  {
    id: 'cosmic_nebula',
    name: 'Chronos Supernova',
    type: 'extra',
    price: 650,
    description: 'An astronomical dense gravity singularity. Swirls with deep purple space dust and twinkling stars.',
    color: '#0d0221',
    secondaryColor: '#b80c09',
    glowColor: 'rgba(138, 43, 226, 0.8)',
    isCosmic: true,
  },
];

export const calculateCoinsEarned = (strokes: number, par: number): number => {
  const diff = par - strokes;
  let earned = 100;
  if (diff > 0) {
    earned += diff * 50;
    if (strokes === 1) {
      earned += 200;
    }
  } else if (diff < 0) {
    earned = Math.max(15, 100 - Math.abs(diff) * 15);
  }
  return earned;
};

