/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemRarity = 'common' | 'rare' | 'legendary' | 'mythical';

export interface RarityConfig {
  id: ItemRarity;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  glowColor: string;
  dropRate: number; // in percentage e.g. 50%
  basePrice: number;
}

export const RARITIES: Record<ItemRarity, RarityConfig> = {
  common: {
    id: 'common',
    name: 'Common',
    color: '#8e8a84',
    badgeBg: 'bg-stone-200 text-stone-700 border-stone-300',
    badgeText: 'text-stone-600',
    borderColor: 'border-stone-300',
    glowColor: 'rgba(142, 138, 132, 0.4)',
    dropRate: 50,
    basePrice: 150,
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    color: '#2563eb',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    badgeText: 'text-blue-600',
    borderColor: 'border-blue-400',
    glowColor: 'rgba(37, 99, 235, 0.6)',
    dropRate: 32,
    basePrice: 450,
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    color: '#ea580c',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-400',
    badgeText: 'text-amber-600',
    borderColor: 'border-amber-500',
    glowColor: 'rgba(234, 88, 12, 0.8)',
    dropRate: 14,
    basePrice: 1200,
  },
  mythical: {
    id: 'mythical',
    name: 'Mythical',
    color: '#9333ea',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-400',
    badgeText: 'text-purple-600',
    borderColor: 'border-purple-500',
    glowColor: 'rgba(147, 51, 234, 0.9)',
    dropRate: 4,
    basePrice: 3500,
  },
};

export interface BallItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  price: number;
  description: string;
  color: string;
  secondaryColor?: string;
  textColor?: string;
  glowColor?: string;
  pattern?: 'solid' | 'stripe' | 'dual_ring' | 'truvis' | 'dots' | 'camo' | 'checker' | 'swirl' | 'rings' | 'stars' | 'number' | 'net' | 'scribble';
  specialType?: 'gold' | '8ball' | 'donut' | 'fire' | 'slime' | 'cosmic' | 'rainbow' | 'chrome' | 'diamond' | 'circuit' | 'dragon' | 'phoenix' | 'void' | 'aurora' | 'tesseract' | 'standard';
  isExclusive?: boolean;
}

export interface TrailItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  price: number;
  description: string;
  color: string;
  secondaryColor?: string;
  particleType: 'dust' | 'spark' | 'flame' | 'bubble' | 'star' | 'laser' | 'lightning' | 'rainbow' | 'matrix' | 'sakura' | 'ice' | 'coins' | 'hearts' | 'smoke' | 'rings' | 'galaxy' | 'phoenix' | 'portal' | 'glitch' | 'aurora' | 'mesh' | 'scribble';
  glowColor?: string;
  particleCount?: number;
  size?: number;
  isExclusive?: boolean;
}

// ============================================================================
// CREATOR EXCLUSIVE SPECIAL ITEMS (NET & SCRIBBLE)
// ============================================================================

export const EXCLUSIVE_BALLS: BallItem[] = [
  {
    id: 'exclusive_net',
    name: 'Net',
    rarity: 'mythical',
    price: 0,
    description: 'Exclusive Creator pattern with a 3D geometric triangulated geodesic wireframe mesh over a warm cork band.',
    color: '#18181b',
    secondaryColor: '#c28b52',
    textColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.95)',
    pattern: 'net',
    specialType: 'standard',
    isExclusive: true,
  },
  {
    id: 'exclusive_scribble',
    name: 'Scribble',
    rarity: 'mythical',
    price: 0,
    description: 'Exclusive Creator pattern with dynamic high-contrast hand-drawn doodle loops and continuous ink calligraphy.',
    color: '#fafaf9',
    secondaryColor: '#09090b',
    textColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.9)',
    pattern: 'scribble',
    specialType: 'standard',
    isExclusive: true,
  }
];

export const EXCLUSIVE_TRAILS: TrailItem[] = [
  {
    id: 'exclusive_trail_net',
    name: 'Net Matrix Mesh',
    rarity: 'mythical',
    price: 0,
    description: 'Emits an interconnected neon wireframe polygon mesh with shimmering vertex nodes as you putt.',
    color: '#38bdf8',
    secondaryColor: '#c28b52',
    particleType: 'mesh',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    particleCount: 25,
    size: 4.5,
    isExclusive: true,
  },
  {
    id: 'exclusive_trail_scribble',
    name: 'Scribble Doodle Ink',
    rarity: 'mythical',
    price: 0,
    description: 'Leaves a whimsical ribbon of swirling ink loops, calligraphy scribbles, and doodle flourishes.',
    color: '#09090b',
    secondaryColor: '#f43f5e',
    particleType: 'scribble',
    glowColor: 'rgba(244, 63, 94, 0.85)',
    particleCount: 25,
    size: 4.5,
    isExclusive: true,
  }
];

// ============================================================================
// 100 BALL ITEMS CATALOG
// ============================================================================

// Base hand-crafted featured balls
const FEATURED_BALLS: BallItem[] = [
  // Common (0-4)
  {
    id: 'classic_white',
    name: 'Classic Tour White',
    rarity: 'common',
    price: 0,
    description: 'The iconic dimpled white tournament golf ball.',
    color: '#ffffff',
    secondaryColor: '#d6d3d1',
    textColor: '#3d312a',
    pattern: 'solid',
    specialType: 'standard',
  },
  {
    id: 'range_stripe',
    name: 'Driving Range Ball',
    rarity: 'common',
    price: 120,
    description: 'Rugged practice ball with a bold black center band.',
    color: '#f5f5f4',
    secondaryColor: '#1c1917',
    pattern: 'stripe',
    specialType: 'standard',
  },
  {
    id: 'prov1_tag',
    name: 'Pro-V Tour Red #1',
    rarity: 'common',
    price: 180,
    description: 'Premium precision distance ball with red number one mark.',
    color: '#ffffff',
    secondaryColor: '#dc2626',
    textColor: '#dc2626',
    pattern: 'number',
    specialType: 'standard',
  },
  {
    id: 'optic_yellow',
    name: 'High-Vis Optic Yellow',
    rarity: 'common',
    price: 150,
    description: 'Ultra-bright chartreuse tour ball for maximum visibility.',
    color: '#eab308',
    secondaryColor: '#292524',
    pattern: 'stripe',
    specialType: 'standard',
  },
  {
    id: 'retro_8ball',
    name: 'Classic Billiard 8-Ball',
    rarity: 'common',
    price: 220,
    description: 'Solid pitch-black cue ball marked with the lucky number 8.',
    color: '#18181b',
    secondaryColor: '#ffffff',
    textColor: '#18181b',
    specialType: '8ball',
  },

  // Rare (5-9)
  {
    id: 'tp5_rings',
    name: 'Dual Ring Precision TP5',
    rarity: 'rare',
    price: 450,
    description: 'Tour alignment dual black & orange target guidance rings.',
    color: '#ffffff',
    secondaryColor: '#ea580c',
    pattern: 'dual_ring',
    specialType: 'standard',
  },
  {
    id: 'chrome_truvis',
    name: 'Truvis Soccer Geometry',
    rarity: 'rare',
    price: 520,
    description: 'Geometric red and white pentagonal patches for spin clarity.',
    color: '#ffffff',
    secondaryColor: '#dc2626',
    pattern: 'truvis',
    specialType: 'standard',
  },
  {
    id: 'metallic_silver',
    name: 'Polished Chrome Sphere',
    rarity: 'rare',
    price: 600,
    description: 'Mirror-polished liquid silver finish with reflection highlights.',
    color: '#e2e8f0',
    secondaryColor: '#94a3b8',
    glowColor: 'rgba(226, 232, 240, 0.7)',
    specialType: 'chrome',
  },
  {
    id: 'camo_tactical',
    name: 'Woodland Camo',
    rarity: 'rare',
    price: 480,
    description: 'Tactical forest camouflage pattern for rugged sand saves.',
    color: '#4d7c0f',
    secondaryColor: '#713f12',
    pattern: 'camo',
    specialType: 'standard',
  },
  {
    id: 'frosted_amethyst',
    name: 'Frosted Amethyst Gem',
    rarity: 'rare',
    price: 550,
    description: 'Translucent violet crystal cut with faceted interior sparkles.',
    color: '#c084fc',
    secondaryColor: '#7e22ce',
    glowColor: 'rgba(192, 132, 252, 0.6)',
    specialType: 'standard',
  },

  // Legendary (10-14)
  {
    id: 'solid_gold',
    name: 'The Midas 24K Master',
    rarity: 'legendary',
    price: 1500,
    description: 'Forged in solid 24K gold with glittering golden particle halos.',
    color: '#fbbf24',
    secondaryColor: '#d97706',
    glowColor: 'rgba(251, 191, 36, 0.9)',
    specialType: 'gold',
  },
  {
    id: 'lava_fireball',
    name: 'Infernal Lava Core',
    rarity: 'legendary',
    price: 1350,
    description: 'Molten magma core with crackling solar flares and red embers.',
    color: '#f97316',
    secondaryColor: '#dc2626',
    glowColor: 'rgba(249, 115, 22, 0.9)',
    specialType: 'fire',
  },
  {
    id: 'slime_goo',
    name: 'Radioactive Toxic Slime',
    rarity: 'legendary',
    price: 1200,
    description: 'Squishy neon-green mutagenic goo that vibrates on movement.',
    color: '#84cc16',
    secondaryColor: '#4d7c0f',
    glowColor: 'rgba(132, 204, 22, 0.8)',
    specialType: 'slime',
  },
  {
    id: 'pink_donut',
    name: 'Glazed Strawberry Donut',
    rarity: 'legendary',
    price: 1250,
    description: 'Sweet strawberry icing dipped in rainbow confection sprinkles.',
    color: '#f472b6',
    secondaryColor: '#78350f',
    specialType: 'donut',
  },
  {
    id: 'cyber_circuit',
    name: 'Cyberpunk Neon Grid',
    rarity: 'legendary',
    price: 1600,
    description: 'Pulsing cyan microcircuits etched onto a carbon nanotube shell.',
    color: '#06b6d4',
    secondaryColor: '#0f172a',
    glowColor: 'rgba(6, 182, 212, 0.9)',
    specialType: 'circuit',
  },

  // Mythical (15-21)
  {
    id: 'cosmic_nebula',
    name: 'Chronos Supernova',
    rarity: 'mythical',
    price: 4500,
    description: 'An astronomical deep-space gravitational vortex with swirling stardust.',
    color: '#6366f1',
    secondaryColor: '#1e1b4b',
    glowColor: 'rgba(99, 102, 241, 1)',
    specialType: 'cosmic',
  },
  {
    id: 'rainbow_prism',
    name: 'Prismatic Rainbow God',
    rarity: 'mythical',
    price: 5000,
    description: 'Shifts smoothly across all spectral wavelengths in radiant harmony.',
    color: '#ec4899',
    secondaryColor: '#8b5cf6',
    glowColor: 'rgba(236, 72, 153, 1)',
    specialType: 'rainbow',
  },
  {
    id: 'phoenix_celestial',
    name: 'Phoenix Celestial Star',
    rarity: 'mythical',
    price: 4800,
    description: 'Reborn from cosmic stardust, wreathed in immortal divine solar flames.',
    color: '#f43f5e',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(244, 63, 94, 1)',
    specialType: 'phoenix',
  },
  {
    id: 'void_singularity',
    name: 'Void Rift Singularity',
    rarity: 'mythical',
    price: 5500,
    description: 'Pure anti-matter black hole that warps the surrounding fairway geometry.',
    color: '#0f172a',
    secondaryColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 1)',
    specialType: 'void',
  },
  {
    id: 'divine_aurora',
    name: 'Aurora Borealis Core',
    rarity: 'mythical',
    price: 4200,
    description: 'Hypnotic emerald and magenta geomagnetic ribbons dancing in orbit.',
    color: '#10b981',
    secondaryColor: '#d946ef',
    glowColor: 'rgba(16, 185, 129, 1)',
    specialType: 'aurora',
  },
  {
    id: 'tesseract_4d',
    name: 'Hypercube 4D Tesseract',
    rarity: 'mythical',
    price: 6000,
    description: 'Transcends 3D physics with shifting four-dimensional hypercube facets.',
    color: '#38bdf8',
    secondaryColor: '#f43f5e',
    glowColor: 'rgba(56, 189, 248, 1)',
    specialType: 'tesseract',
  },
  {
    id: 'diamond_shimmer',
    name: 'Eternal 100-Carat Diamond',
    rarity: 'mythical',
    price: 5200,
    description: 'Pure flawless diamond gem with sparkling prismatic optical refractions.',
    color: '#f0f9ff',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(240, 249, 255, 1)',
    specialType: 'diamond',
  }
];

// Helper to generate the rest of the 100 balls systematically
function generateAllBalls(): BallItem[] {
  const list: BallItem[] = [...FEATURED_BALLS];

  // Common styles (target 40 total common)
  const commonColors = [
    { name: 'Matte Crimson', col: '#e11d48', sec: '#881337' },
    { name: 'Sky Blue Classic', col: '#0284c7', sec: '#075985' },
    { name: 'Forest Moss', col: '#15803d', sec: '#14532d' },
    { name: 'Tangerine Sun', col: '#ea580c', sec: '#9a3412' },
    { name: 'Pastel Lavender', col: '#c084fc', sec: '#6b21a8' },
    { name: 'Bubblegum Pink', col: '#ec4899', sec: '#9d174d' },
    { name: 'Mint Sorbet', col: '#2dd4bf', sec: '#115e59' },
    { name: 'Mocha Bronze', col: '#a16207', sec: '#713f12' },
    { name: 'Steel Slate', col: '#64748b', sec: '#334155' },
    { name: 'Lemon Zest', col: '#facc15', sec: '#ca8a04' },
    { name: 'Tennis Ball Felt', col: '#ccff00', sec: '#ffffff' },
    { name: 'Basketball Leather', col: '#d97706', sec: '#1c1917' },
    { name: 'Soccer Hex Classic', col: '#f5f5f4', sec: '#1c1917' },
    { name: 'Baseball Stitches', col: '#fafaf9', sec: '#dc2626' },
    { name: 'Beach Party Stripe', col: '#38bdf8', sec: '#f43f5e' },
    { name: 'Matte Charcoal', col: '#334155', sec: '#0f172a' },
    { name: 'Vintage 1920 Dimple', col: '#fef08a', sec: '#ca8a04' },
    { name: 'Desert Sand Dune', col: '#fed7aa', sec: '#9a3412' },
    { name: 'Arctic Ice White', col: '#e0f2fe', sec: '#bae6fd' },
    { name: 'Olive Drab Mat', col: '#65a30d', sec: '#365314' },
    { name: 'Billiard Solid 1 (Yellow)', col: '#facc15', sec: '#1c1917' },
    { name: 'Billiard Solid 2 (Blue)', col: '#2563eb', sec: '#1c1917' },
    { name: 'Billiard Solid 3 (Red)', col: '#dc2626', sec: '#1c1917' },
    { name: 'Billiard Solid 4 (Purple)', col: '#7c3aed', sec: '#1c1917' },
    { name: 'Billiard Solid 5 (Orange)', col: '#ea580c', sec: '#1c1917' },
    { name: 'Billiard Solid 6 (Green)', col: '#16a34a', sec: '#1c1917' },
    { name: 'Billiard Solid 7 (Maroon)', col: '#991b1b', sec: '#1c1917' },
    { name: 'Billiard Stripe 9', col: '#fef08a', sec: '#ca8a04' },
    { name: 'Billiard Stripe 10', col: '#bfdbfe', sec: '#1d4ed8' },
    { name: 'Billiard Stripe 11', col: '#fecaca', sec: '#b91c1c' },
    { name: 'Billiard Stripe 12', col: '#ddd6fe', sec: '#6d28d9' },
    { name: 'Billiard Stripe 13', col: '#ffedd5', sec: '#c2410c' },
    { name: 'Billiard Stripe 14', col: '#bbf7d0', sec: '#15803d' },
    { name: 'Billiard Stripe 15', col: '#fee2e2', sec: '#7f1d1d' },
    { name: 'Club Cadet Blue', col: '#38bdf8', sec: '#0284c7' },
  ];

  commonColors.forEach((c, idx) => {
    if (list.filter(b => b.rarity === 'common').length < 40) {
      list.push({
        id: `ball_common_${idx + 1}`,
        name: c.name,
        rarity: 'common',
        price: 100 + (idx % 8) * 20,
        description: `Clean and reliable ${c.name.toLowerCase()} design for regular tee offs.`,
        color: c.col,
        secondaryColor: c.sec,
        pattern: idx % 3 === 0 ? 'stripe' : idx % 3 === 1 ? 'dots' : 'solid',
        specialType: 'standard',
      });
    }
  });

  // Rare styles (target 35 total rare)
  const rareSpecs = [
    { name: 'Polished Copper', col: '#d97706', sec: '#78350f', glow: 'rgba(217, 119, 6, 0.6)' },
    { name: 'Emerald Gemstone', col: '#059669', sec: '#064e3b', glow: 'rgba(5, 150, 105, 0.6)' },
    { name: 'Sapphire Crystal', col: '#2563eb', sec: '#1e3a8a', glow: 'rgba(37, 99, 235, 0.6)' },
    { name: 'Ruby Core Tour', col: '#e11d48', sec: '#881337', glow: 'rgba(225, 29, 72, 0.6)' },
    { name: 'Rose Gold Metallic', col: '#f43f5e', sec: '#fb7185', glow: 'rgba(244, 63, 94, 0.6)' },
    { name: 'Carbon Fiber Weave', col: '#27272a', sec: '#09090b', glow: 'rgba(39, 39, 42, 0.5)' },
    { name: 'Tiger Safari Stripe', col: '#f97316', sec: '#18181b', glow: 'rgba(249, 115, 22, 0.5)' },
    { name: 'Zebra Monochrome', col: '#fafafa', sec: '#09090b', glow: 'rgba(250, 250, 250, 0.5)' },
    { name: 'Cheetah Gold Spot', col: '#eab308', sec: '#451a03', glow: 'rgba(234, 179, 8, 0.5)' },
    { name: 'Digital Glitch Matrix', col: '#10b981', sec: '#064e3b', glow: 'rgba(16, 185, 129, 0.6)' },
    { name: 'Ocean Pearl Iridescent', col: '#e0f2fe', sec: '#fbcfe8', glow: 'rgba(224, 242, 254, 0.6)' },
    { name: 'Molten Bronze Relic', col: '#b45309', sec: '#451a03', glow: 'rgba(180, 83, 9, 0.6)' },
    { name: 'Cyber Blue Tracer', col: '#06b6d4', sec: '#083344', glow: 'rgba(6, 182, 212, 0.6)' },
    { name: 'Neon Violet Laser', col: '#8b5cf6', sec: '#4c1d95', glow: 'rgba(139, 92, 246, 0.6)' },
    { name: 'Golden Honeycomb', col: '#f59e0b', sec: '#78350f', glow: 'rgba(245, 158, 11, 0.6)' },
    { name: 'Water Swirl Splash', col: '#38bdf8', sec: '#0369a1', glow: 'rgba(56, 189, 248, 0.6)' },
    { name: 'Lava Rock Basalt', col: '#44403c', sec: '#dc2626', glow: 'rgba(220, 38, 38, 0.6)' },
    { name: 'Glacial Permafrost', col: '#bae6fd', sec: '#0284c7', glow: 'rgba(186, 230, 253, 0.6)' },
    { name: 'Obsidian Shard', col: '#1c1917', sec: '#7c3aed', glow: 'rgba(124, 58, 237, 0.6)' },
    { name: 'Solaris Flare Ring', col: '#fb923c', sec: '#ea580c', glow: 'rgba(251, 146, 60, 0.6)' },
    { name: 'Midnight Purple Tour', col: '#581c87', sec: '#3b0764', glow: 'rgba(88, 28, 135, 0.6)' },
    { name: 'Hyper Orange Neon', col: '#ff5722', sec: '#b71c1c', glow: 'rgba(255, 87, 34, 0.6)' },
    { name: 'Electric Lime Flash', col: '#a3e635', sec: '#365314', glow: 'rgba(163, 230, 53, 0.6)' },
    { name: 'Titanium Matte Gunmetal', col: '#64748b', sec: '#1e293b', glow: 'rgba(100, 116, 139, 0.6)' },
    { name: 'Checkerboard Grand Prix', col: '#f8fafc', sec: '#0f172a', glow: 'rgba(15, 23, 42, 0.5)' },
    { name: 'Cherry Blossom Bloom', col: '#fbcfe8', sec: '#db2777', glow: 'rgba(251, 207, 232, 0.6)' },
    { name: 'Dragon Scale Teal', col: '#14b8a6', sec: '#115e59', glow: 'rgba(20, 184, 166, 0.6)' },
    { name: 'Bonsai Jade Core', col: '#4ade80', sec: '#166534', glow: 'rgba(74, 222, 128, 0.6)' },
    { name: 'Sunburst Sunset Gradient', col: '#fb923c', sec: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
    { name: 'Steampunk Brass Gear', col: '#d97706', sec: '#451a03', glow: 'rgba(217, 119, 6, 0.6)' },
  ];

  rareSpecs.forEach((r, idx) => {
    if (list.filter(b => b.rarity === 'rare').length < 35) {
      list.push({
        id: `ball_rare_${idx + 1}`,
        name: r.name,
        rarity: 'rare',
        price: 350 + (idx % 6) * 50,
        description: `Premium rare ${r.name.toLowerCase()} featuring special gloss and metallic highlights.`,
        color: r.col,
        secondaryColor: r.sec,
        glowColor: r.glow,
        pattern: idx % 2 === 0 ? 'swirl' : 'dual_ring',
        specialType: 'standard',
      });
    }
  });

  // Legendary styles (target 18 total legendary)
  const legendarySpecs = [
    { name: 'Dynamo Lightning Orb', col: '#38bdf8', sec: '#facc15', glow: 'rgba(56, 189, 248, 0.9)' },
    { name: 'Vampiric Blood Diamond', col: '#dc2626', sec: '#450a0a', glow: 'rgba(220, 38, 38, 0.9)' },
    { name: 'Celestial Moondust', col: '#e2e8f0', sec: '#6366f1', glow: 'rgba(226, 232, 240, 0.9)' },
    { name: 'Quantum Antimatter', col: '#a855f7', sec: '#3b0764', glow: 'rgba(168, 85, 247, 0.9)' },
    { name: 'Solar Eclipse Core', col: '#0f172a', sec: '#f97316', glow: 'rgba(249, 115, 22, 0.9)' },
    { name: 'Cryo Frostfire Sphere', col: '#67e8f9', sec: '#ef4444', glow: 'rgba(103, 232, 249, 0.9)' },
    { name: 'Eldritch Eye of Chaos', col: '#84cc16', sec: '#7c3aed', glow: 'rgba(132, 204, 22, 0.9)' },
    { name: 'Arcade 8-Bit Pixel Block', col: '#f43f5e', sec: '#06b6d4', glow: 'rgba(244, 63, 94, 0.9)' },
    { name: 'Starlight Constellation', col: '#fef08a', sec: '#4338ca', glow: 'rgba(254, 240, 138, 0.9)' },
    { name: 'Volcanic Caldera Magma', col: '#ef4444', sec: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.9)' },
    { name: 'Holographic Disco Sphere', col: '#f472b6', sec: '#22d3ee', glow: 'rgba(244, 114, 182, 0.9)' },
    { name: 'Dragon Heart Core', col: '#f97316', sec: '#991b1b', glow: 'rgba(249, 115, 22, 0.9)' },
    { name: 'Bioluminescent Abyssal', col: '#0d9488', sec: '#042f2e', glow: 'rgba(13, 148, 136, 0.9)' },
  ];

  legendarySpecs.forEach((l, idx) => {
    if (list.filter(b => b.rarity === 'legendary').length < 18) {
      list.push({
        id: `ball_legendary_${idx + 1}`,
        name: l.name,
        rarity: 'legendary',
        price: 1100 + (idx % 5) * 100,
        description: `Legendary power orb pulsating with ${l.name.toLowerCase()} elemental particle aura.`,
        color: l.col,
        secondaryColor: l.sec,
        glowColor: l.glow,
        specialType: 'dragon',
      });
    }
  });

  return list.slice(0, 100);
}

export const BALLS_STORE_ITEMS: BallItem[] = [...EXCLUSIVE_BALLS, ...generateAllBalls()];

// ============================================================================
// 100 TRAIL ITEMS CATALOG
// ============================================================================

const FEATURED_TRAILS: TrailItem[] = [
  // Common (0-4)
  {
    id: 'trail_dust_white',
    name: 'Soft Chalk Dust',
    rarity: 'common',
    price: 0,
    description: 'Subtle puffs of powdery white chalk trailing every putt.',
    color: '#e7e5e4',
    secondaryColor: '#d6d3d1',
    particleType: 'dust',
    particleCount: 15,
  },
  {
    id: 'trail_grass_clippings',
    name: 'Green Grass Debris',
    rarity: 'common',
    price: 90,
    description: 'Fresh blade clippings kicked up from the manicured green turf.',
    color: '#65a30d',
    secondaryColor: '#365314',
    particleType: 'dust',
    particleCount: 20,
  },
  {
    id: 'trail_smoke_grey',
    name: 'Drifting Grey Smoke',
    rarity: 'common',
    price: 120,
    description: 'Smooth wisps of grey smoke billowing behind fast shots.',
    color: '#a8a29e',
    secondaryColor: '#78716c',
    particleType: 'smoke',
    particleCount: 18,
  },
  {
    id: 'trail_water_bubbles',
    name: 'Aquatic Bubble Stream',
    rarity: 'common',
    price: 150,
    description: 'Translucent aquatic bubbles floating upward gracefully.',
    color: '#7dd3fc',
    secondaryColor: '#0284c7',
    particleType: 'bubble',
    particleCount: 22,
  },
  {
    id: 'trail_sand_spray',
    name: 'Bunker Sand Spray',
    rarity: 'common',
    price: 130,
    description: 'Golden granules of sand spraying outwards on impact.',
    color: '#fde047',
    secondaryColor: '#ca8a04',
    particleType: 'dust',
    particleCount: 24,
  },

  // Rare (5-9)
  {
    id: 'trail_fire_embers',
    name: 'Blazing Fire Embers',
    rarity: 'rare',
    price: 400,
    description: 'Crackling orange embers and sparks flying in a burning wake.',
    color: '#f97316',
    secondaryColor: '#ef4444',
    glowColor: 'rgba(249, 115, 22, 0.8)',
    particleType: 'flame',
    particleCount: 28,
  },
  {
    id: 'trail_laser_cyan',
    name: 'Neon Laser Beam',
    rarity: 'rare',
    price: 450,
    description: 'Sharp luminescent cyan laser tracer connecting your trajectory.',
    color: '#06b6d4',
    secondaryColor: '#22d3ee',
    glowColor: 'rgba(6, 182, 212, 0.9)',
    particleType: 'laser',
    particleCount: 30,
  },
  {
    id: 'trail_ice_frost',
    name: 'Glacial Frost Crystals',
    rarity: 'rare',
    price: 420,
    description: 'Glittering six-pointed ice snowflakes and chilly frost mist.',
    color: '#bae6fd',
    secondaryColor: '#38bdf8',
    glowColor: 'rgba(186, 230, 253, 0.8)',
    particleType: 'ice',
    particleCount: 25,
  },
  {
    id: 'trail_sakura_petals',
    name: 'Cherry Blossom Petals',
    rarity: 'rare',
    price: 480,
    description: 'Delicate pink sakura blossoms gently swirling along the grass.',
    color: '#f472b6',
    secondaryColor: '#fbcfe8',
    glowColor: 'rgba(244, 114, 182, 0.7)',
    particleType: 'sakura',
    particleCount: 22,
  },
  {
    id: 'trail_matrix_code',
    name: 'Matrix Digital Rain',
    rarity: 'rare',
    price: 500,
    description: 'Cascading vertical lines of green binary glyphs and code.',
    color: '#22c55e',
    secondaryColor: '#15803d',
    glowColor: 'rgba(34, 197, 94, 0.9)',
    particleType: 'matrix',
    particleCount: 32,
  },

  // Legendary (10-14)
  {
    id: 'trail_gold_coins',
    name: 'Golden Doubloons & Coins',
    rarity: 'legendary',
    price: 1200,
    description: 'A rain of sparkling 24K gold coins and diamond dollar signs.',
    color: '#facc15',
    secondaryColor: '#eab308',
    glowColor: 'rgba(250, 204, 21, 0.9)',
    particleType: 'coins',
    particleCount: 35,
  },
  {
    id: 'trail_electric_forks',
    name: 'High-Voltage Lightning',
    rarity: 'legendary',
    price: 1350,
    description: 'Forking electric plasma arcs shocking the surrounding turf.',
    color: '#38bdf8',
    secondaryColor: '#e0e7ff',
    glowColor: 'rgba(56, 189, 248, 1)',
    particleType: 'lightning',
    particleCount: 36,
  },
  {
    id: 'trail_starlight_sparks',
    name: 'Starry Constellation Wake',
    rarity: 'legendary',
    price: 1250,
    description: 'Twinkling 5-point stars and glowing diamond nova sparks.',
    color: '#fef08a',
    secondaryColor: '#a855f7',
    glowColor: 'rgba(254, 240, 138, 0.9)',
    particleType: 'star',
    particleCount: 34,
  },
  {
    id: 'trail_rainbow_ribbon',
    name: 'Radiant Rainbow Ribbon',
    rarity: 'legendary',
    price: 1400,
    description: 'Flowing vibrant multi-colored spectral bands with sparkle glints.',
    color: '#ec4899',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(236, 72, 153, 0.9)',
    particleType: 'rainbow',
    particleCount: 38,
  },
  {
    id: 'trail_retro_pixel',
    name: 'Retro 8-Bit Arcade Blast',
    rarity: 'legendary',
    price: 1150,
    description: 'Chunky arcade pixels erupting in satisfying 80s gaming hues.',
    color: '#f43f5e',
    secondaryColor: '#10b981',
    glowColor: 'rgba(244, 63, 94, 0.9)',
    particleType: 'glitch',
    particleCount: 30,
  },

  // Mythical (15-21)
  {
    id: 'trail_galaxy_spiral',
    name: 'Cosmic Galaxy Spiral',
    rarity: 'mythical',
    price: 3800,
    description: 'Swirling deep-space spiral galaxies with miniature orbiting planets.',
    color: '#818cf8',
    secondaryColor: '#c084fc',
    glowColor: 'rgba(129, 140, 248, 1)',
    particleType: 'galaxy',
    particleCount: 45,
  },
  {
    id: 'trail_phoenix_wings',
    name: 'Phoenix Firestorm Wings',
    rarity: 'mythical',
    price: 4200,
    description: 'Divine immortal firebirds swooping through trails of solar fire.',
    color: '#f43f5e',
    secondaryColor: '#fbbf24',
    glowColor: 'rgba(244, 63, 94, 1)',
    particleType: 'phoenix',
    particleCount: 50,
  },
  {
    id: 'trail_void_rift',
    name: 'Dimensional Void Rift',
    rarity: 'mythical',
    price: 4500,
    description: 'Cracks open spacetime revealing dark matter and glowing purple rifts.',
    color: '#a855f7',
    secondaryColor: '#09090b',
    glowColor: 'rgba(168, 85, 247, 1)',
    particleType: 'portal',
    particleCount: 48,
  },
  {
    id: 'trail_aurora_dance',
    name: 'Divine Aurora Borealis',
    rarity: 'mythical',
    price: 3900,
    description: 'Curtains of shifting emerald, cyan, and violet geomagnetic light.',
    color: '#34d399',
    secondaryColor: '#e879f9',
    glowColor: 'rgba(52, 211, 153, 1)',
    particleType: 'aurora',
    particleCount: 46,
  },
  {
    id: 'trail_quantum_glitch',
    name: 'Quantum Reality Glitch',
    rarity: 'mythical',
    price: 4600,
    description: 'Distorts the screen with chromatic RGB split vectors and hyper-glitches.',
    color: '#06b6d4',
    secondaryColor: '#ec4899',
    glowColor: 'rgba(6, 182, 212, 1)',
    particleType: 'glitch',
    particleCount: 50,
  },
  {
    id: 'trail_heart_charm',
    name: 'Cupid Love Charm',
    rarity: 'mythical',
    price: 3600,
    description: 'Flocks of glittering pink hearts bursting with love and romance.',
    color: '#fb7185',
    secondaryColor: '#fda4af',
    glowColor: 'rgba(251, 113, 133, 1)',
    particleType: 'hearts',
    particleCount: 42,
  },
  {
    id: 'trail_hyperdrive_warp',
    name: 'Warp Speed Hyperdrive',
    rarity: 'mythical',
    price: 4800,
    description: 'Hyper-extended light speed star streaks launching across spacetime.',
    color: '#38bdf8',
    secondaryColor: '#ffffff',
    glowColor: 'rgba(56, 189, 248, 1)',
    particleType: 'laser',
    particleCount: 52,
  },
];

function generateAllTrails(): TrailItem[] {
  const list: TrailItem[] = [...FEATURED_TRAILS];

  // Additional Common Trails (target 40 common)
  const commonNames = [
    'Pencil Graphite Sketch', 'Dashed White Chalk', 'Gravel Kick', 'Autumn Orange Leaves',
    'Rain Shower Mist', 'Confetti Popper Specks', 'Coffee Steam Wisps', 'Blueberry Juice Splash',
    'Lemon Powder Dust', 'Charcoal Rub', 'Faded Green Turf', 'Clay Dust Red', 'Snow Spray Cold',
    'Wood Shavings Light', 'Cotton Fluff', 'Silt Particle Drift', 'Pebble Ricochet', 'Feather Float',
    'Dandelion Spores', 'Cinnamon Dust', 'Seafoam Wake', 'Cardboard Flakes', 'Dust Bunny Swirl',
    'Ash Flakes Grey', 'Puddle Ripple', 'Paper Scrap Flutter', 'Fuzz Glow Soft', 'Chalk Line Blue',
    'Chalk Line Yellow', 'Chalk Line Pink', 'Chalk Line Orange', 'Chalk Line Green', 'Tumbleweed Twig',
    'Brown Soil Clod', 'Dry Grass Straw'
  ];

  commonNames.forEach((name, idx) => {
    if (list.filter(t => t.rarity === 'common').length < 40) {
      list.push({
        id: `trail_common_${idx + 1}`,
        name: name,
        rarity: 'common',
        price: 80 + (idx % 6) * 20,
        description: `Subtle aesthetic ${name.toLowerCase()} trail for smooth putting lines.`,
        color: idx % 4 === 0 ? '#e2e8f0' : idx % 4 === 1 ? '#86efac' : idx % 4 === 2 ? '#fde047' : '#fdba74',
        secondaryColor: '#94a3b8',
        particleType: idx % 3 === 0 ? 'dust' : idx % 3 === 1 ? 'smoke' : 'bubble',
        particleCount: 16 + (idx % 8),
      });
    }
  });

  // Additional Rare Trails (target 35 rare)
  const rareNames = [
    'Plasma Violet Ray', 'Firefly Lantern Glow', 'Cyberpunk Blue Trace', 'Volcanic Ash Spark',
    'Toxic Green Goo', 'Molten Copper Drip', 'Sunflower Pollen Wave', 'Ruby Spark Shower',
    'Sonic Soundwave Ripple', 'Emerald Shimmer', 'Amethyst Mist Swirl', 'Bubblegum Pop',
    'Aqua Jet Stream', 'Solar Flare Burst', 'Laser Emerald Beam', 'Laser Ruby Beam',
    'Laser Violet Beam', 'Glacier Shard Spray', 'Cotton Candy Cloud', 'Golden Honey Drip',
    'Bioluminescent Wave', 'Sunset Orange Flare', 'Deep Ocean Splash', 'Magma Ember Crackle',
    'Radioactive Green Glow', 'Prismatic Star Flare', 'Night Sky Blue Stardust', 'Thunder Sparkle',
    'Neon Pink Tracer', 'Cyber Yellow Beam'
  ];

  rareNames.forEach((name, idx) => {
    if (list.filter(t => t.rarity === 'rare').length < 35) {
      list.push({
        id: `trail_rare_${idx + 1}`,
        name: name,
        rarity: 'rare',
        price: 360 + (idx % 6) * 40,
        description: `Rare animated ${name.toLowerCase()} leaving glowing visual streaks.`,
        color: idx % 4 === 0 ? '#06b6d4' : idx % 4 === 1 ? '#ec4899' : idx % 4 === 2 ? '#84cc16' : '#f59e0b',
        secondaryColor: '#ffffff',
        glowColor: 'rgba(6, 182, 212, 0.75)',
        particleType: idx % 4 === 0 ? 'spark' : idx % 4 === 1 ? 'flame' : idx % 4 === 2 ? 'laser' : 'ice',
        particleCount: 26 + (idx % 6),
      });
    }
  });

  // Additional Legendary Trails (target 18 legendary)
  const legendaryNames = [
    'Inferno Dragon Breath', 'Superconductor Magnetic Flux', 'Stardust Nebula Wake',
    'Meteorite Impact Spark', 'Hyper-Speed Tachyon', 'Thunder God Mjolnir', 'Solar Nova Eruption',
    'Disco Glitter Rain', 'Crystalline Prism Shower', 'Chrono Time Warp Blur', 'Eldritch Dark Spores',
    'Royal Golden Sparkle', 'Abyssal Deep Ocean Wave'
  ];

  legendaryNames.forEach((name, idx) => {
    if (list.filter(t => t.rarity === 'legendary').length < 18) {
      list.push({
        id: `trail_legendary_${idx + 1}`,
        name: name,
        rarity: 'legendary',
        price: 1100 + (idx % 4) * 100,
        description: `Legendary particle effect emitting bright ${name.toLowerCase()} energy.`,
        color: idx % 3 === 0 ? '#facc15' : idx % 3 === 1 ? '#38bdf8' : '#f43f5e',
        secondaryColor: '#ffffff',
        glowColor: 'rgba(250, 204, 21, 0.95)',
        particleType: idx % 3 === 0 ? 'lightning' : idx % 3 === 1 ? 'star' : 'rainbow',
        particleCount: 36 + (idx % 6),
      });
    }
  });

  return list.slice(0, 100);
}

export const TRAILS_STORE_ITEMS: TrailItem[] = [...EXCLUSIVE_TRAILS, ...generateAllTrails()];

// ============================================================================
// DAILY SHOP GENERATOR (5 BALLS + 5 TRAILS ROTATING DAILY)
// ============================================================================

// Deterministic seed PRNG based on date string (e.g. "2026-08-24")
function getDaySeed(dateString?: string): number {
  const date = dateString || new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function pseudoRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getDailyShopItems(dateString?: string): { balls: BallItem[]; trails: TrailItem[]; resetTime: string } {
  const seed = getDaySeed(dateString);
  const rng = pseudoRandom(seed);

  // Pick 5 unique balls (exclude creator exclusive items from public coin shop)
  const availableBalls = BALLS_STORE_ITEMS.filter(b => !b.isExclusive);
  const commonBalls = availableBalls.filter(b => b.rarity === 'common');
  const rareBalls = availableBalls.filter(b => b.rarity === 'rare');
  const highTierBalls = availableBalls.filter(b => b.rarity === 'legendary' || b.rarity === 'mythical');

  const selectedBalls: BallItem[] = [];
  const pickFrom = (pool: BallItem[]) => {
    const idx = Math.floor(rng() * pool.length);
    return pool[idx];
  };

  while (selectedBalls.length < 2 && commonBalls.length > 0) {
    const item = pickFrom(commonBalls);
    if (!selectedBalls.some(b => b.id === item.id)) selectedBalls.push(item);
  }
  while (selectedBalls.length < 4 && rareBalls.length > 0) {
    const item = pickFrom(rareBalls);
    if (!selectedBalls.some(b => b.id === item.id)) selectedBalls.push(item);
  }
  while (selectedBalls.length < 5 && highTierBalls.length > 0) {
    const item = pickFrom(highTierBalls);
    if (!selectedBalls.some(b => b.id === item.id)) selectedBalls.push(item);
  }

  // Pick 5 unique trails (exclude creator exclusive items from public coin shop)
  const availableTrails = TRAILS_STORE_ITEMS.filter(t => !t.isExclusive);
  const commonTrails = availableTrails.filter(t => t.rarity === 'common');
  const rareTrails = availableTrails.filter(t => t.rarity === 'rare');
  const highTierTrails = availableTrails.filter(t => t.rarity === 'legendary' || t.rarity === 'mythical');

  const selectedTrails: TrailItem[] = [];
  while (selectedTrails.length < 2 && commonTrails.length > 0) {
    const item = pickFrom(commonTrails);
    if (!selectedTrails.some(t => t.id === item.id)) selectedTrails.push(item);
  }
  while (selectedTrails.length < 4 && rareTrails.length > 0) {
    const item = pickFrom(rareTrails);
    if (!selectedTrails.some(t => t.id === item.id)) selectedTrails.push(item);
  }
  while (selectedTrails.length < 5 && highTierTrails.length > 0) {
    const item = pickFrom(highTierTrails);
    if (!selectedTrails.some(t => t.id === item.id)) selectedTrails.push(item);
  }

  // Calculate midnight UTC reset
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const resetTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    balls: selectedBalls,
    trails: selectedTrails,
    resetTime,
  };
}

// ============================================================================
// MYSTERY CHEST UNBOXING SYSTEM
// ============================================================================

export interface ChestType {
  id: 'ball_chest' | 'trail_box' | 'mega_crate';
  name: string;
  price: number;
  description: string;
  icon: string;
  color: string;
  type: 'ball' | 'trail' | 'both';
}

export const CHESTS: ChestType[] = [
  {
    id: 'ball_chest',
    name: 'Mystic Ball Chest',
    price: 200,
    description: 'Unbox 1 random golf ball across all 4 rarities with chance for Mythicals!',
    icon: '⚽',
    color: '#ea580c',
    type: 'ball',
  },
  {
    id: 'trail_box',
    name: 'Cosmic Trail Box',
    price: 180,
    description: 'Unbox 1 random particle putting trail across all 4 rarities!',
    icon: '✨',
    color: '#8b5cf6',
    type: 'trail',
  },
  {
    id: 'mega_crate',
    name: 'Mega Champion Crate',
    price: 350,
    description: 'Guaranteed 1 Ball AND 1 Trail with 2X boosted Legendary & Mythical drop rates!',
    icon: '🌟',
    color: '#fbbf24',
    type: 'both',
  },
];

export function rollRarity(isBoosted = false): ItemRarity {
  const rand = Math.random() * 100;
  if (isBoosted) {
    // Boosted rates for Mega crate: Mythical 8%, Legendary 24%, Rare 38%, Common 30%
    if (rand < 8) return 'mythical';
    if (rand < 32) return 'legendary';
    if (rand < 70) return 'rare';
    return 'common';
  }

  // Standard rates: Mythical 4%, Legendary 14%, Rare 32%, Common 50%
  if (rand < 4) return 'mythical';
  if (rand < 18) return 'legendary';
  if (rand < 50) return 'rare';
  return 'common';
}

export function openBallChest(isBoosted = false): BallItem {
  const targetRarity = rollRarity(isBoosted);
  const pool = BALLS_STORE_ITEMS.filter(b => b.rarity === targetRarity && !b.isExclusive);
  if (pool.length === 0) return BALLS_STORE_ITEMS.filter(b => !b.isExclusive)[0] || BALLS_STORE_ITEMS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openTrailBox(isBoosted = false): TrailItem {
  const targetRarity = rollRarity(isBoosted);
  const pool = TRAILS_STORE_ITEMS.filter(t => t.rarity === targetRarity && !t.isExclusive);
  if (pool.length === 0) return TRAILS_STORE_ITEMS.filter(t => !t.isExclusive)[0] || TRAILS_STORE_ITEMS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export const calculateCoinsEarned = (strokes: number, par: number): number => {
  const diff = par - strokes;
  let earned = 100;
  if (diff > 0) {
    earned += diff * 60;
    if (strokes === 1) {
      earned += 250; // Hole in one bonus
    }
  } else if (diff < 0) {
    earned = Math.max(25, 100 - Math.abs(diff) * 15);
  }
  return earned;
};

export const ALL_BALL_IDS: string[] = BALLS_STORE_ITEMS.map(b => b.id);
export const ALL_TRAIL_IDS: string[] = TRAILS_STORE_ITEMS.map(t => t.id);

// ============================================================================
// CREATOR DISTRIBUTION & REDEMPTION SYSTEM
// ============================================================================

export interface CreatorRedeemResult {
  success: boolean;
  message: string;
  ballsUnlocked: string[];
  trailsUnlocked: string[];
}

export function redeemCreatorGiftCode(rawCode: string): CreatorRedeemResult {
  const code = (rawCode || '').trim().toUpperCase().replace(/[\s-_]/g, '');

  if (['MARTINNET', 'NETEXCLUSIVE', 'NETSKIN', 'NET2026', 'NETCREATOR'].includes(code)) {
    return {
      success: true,
      message: 'Exclusive Net Ball & Net Matrix Trail Unlocked!',
      ballsUnlocked: ['exclusive_net'],
      trailsUnlocked: ['exclusive_trail_net'],
    };
  }

  if (['MARTINSCRIBBLE', 'SCRIBBLEVIP', 'SCRIBBLESKIN', 'SCRIBBLE2026', 'SCRIBBLECREATOR', 'SCRIBBLE3'].includes(code)) {
    return {
      success: true,
      message: 'Exclusive Scribble Ball & Scribble Ink Trail Unlocked!',
      ballsUnlocked: ['exclusive_scribble'],
      trailsUnlocked: ['exclusive_trail_scribble'],
    };
  }

  if (['MARTIN', 'MARTINLUQUETTA', 'MARTINVIP', 'MARTINDUO', 'CREATORDUO', 'ALLACCESS', 'MARTINALL', 'CREATORSET'].includes(code)) {
    return {
      success: true,
      message: 'Full Creator Vault Unlocked: Net & Scribble Sets Claimed!',
      ballsUnlocked: ['exclusive_net', 'exclusive_scribble'],
      trailsUnlocked: ['exclusive_trail_net', 'exclusive_trail_scribble'],
    };
  }

  return {
    success: false,
    message: 'Invalid or unrecognized creator gift code. Check with Martin for a valid exclusive code!',
    ballsUnlocked: [],
    trailsUnlocked: [],
  };
}

