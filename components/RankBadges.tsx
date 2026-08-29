/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RankTier, getRankFromRP } from './RankData';

interface RankLogoProps {
  tier: number;
  size?: number; // width/height in px
  showGlow?: boolean;
  className?: string;
  animate?: boolean;
}

export const RankLogo: React.FC<RankLogoProps> = ({
  tier,
  size = 48,
  showGlow = false,
  className = '',
  animate = false
}) => {
  const safeTier = Math.min(7, Math.max(1, tier || 1));

  // Render bespoke vector artwork for each rank
  const renderLogoContent = () => {
    switch (safeTier) {
      // 1. Rookie Tee - Tee de madera con marco de bronce
      case 1:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="bronzeFrame1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d99859" />
                <stop offset="50%" stopColor="#a35f28" />
                <stop offset="100%" stopColor="#693611" />
              </linearGradient>
              <linearGradient id="woodTee1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f5c285" />
                <stop offset="40%" stopColor="#d6924b" />
                <stop offset="100%" stopColor="#9e5e22" />
              </linearGradient>
              <radialGradient id="ballBronzeGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </radialGradient>
              <radialGradient id="bronzeInnerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3d2110" />
                <stop offset="100%" stopColor="#1e0f06" />
              </radialGradient>
            </defs>

            {/* Bronze Outer Shield */}
            <polygon
              points="50,4 88,22 88,72 50,96 12,72 12,22"
              fill="url(#bronzeFrame1)"
              stroke="#ffd8a8"
              strokeWidth="2.5"
            />
            {/* Bronze Inner Shield */}
            <polygon
              points="50,11 81,26 81,68 50,89 19,68 19,26"
              fill="url(#bronzeInnerGlow)"
              stroke="#8c4e1f"
              strokeWidth="2"
            />

            {/* Bronze Rivets */}
            <circle cx="50" cy="8" r="2" fill="#ffe8cc" />
            <circle cx="84" cy="24" r="2" fill="#ffe8cc" />
            <circle cx="84" cy="70" r="2" fill="#ffe8cc" />
            <circle cx="50" cy="92" r="2" fill="#ffe8cc" />
            <circle cx="16" cy="70" r="2" fill="#ffe8cc" />
            <circle cx="16" cy="24" r="2" fill="#ffe8cc" />

            {/* Wooden Tee */}
            <path
              d="M 37 38 C 37 33, 63 33, 63 38 C 63 42, 54 45, 53 58 L 53 82 C 53 84, 47 84, 47 82 L 47 58 C 46 45, 37 42, 37 38 Z"
              fill="url(#woodTee1)"
              stroke="#5c3412"
              strokeWidth="1.5"
            />
            {/* Wood Texture Rings */}
            <line x1="43" y1="44" x2="57" y2="44" stroke="#783e10" strokeWidth="1" opacity="0.6" />
            <line x1="47" y1="56" x2="53" y2="56" stroke="#783e10" strokeWidth="1" opacity="0.6" />
            <line x1="48" y1="68" x2="52" y2="68" stroke="#783e10" strokeWidth="1" opacity="0.6" />

            {/* Golf Ball Resting on Tee */}
            <circle cx="50" cy="28" r="14" fill="url(#ballBronzeGrad)" stroke="#64748b" strokeWidth="1.2" />
            {/* Dimple details */}
            <circle cx="46" cy="25" r="1.3" fill="#cbd5e1" />
            <circle cx="53" cy="24" r="1.3" fill="#cbd5e1" />
            <circle cx="50" cy="30" r="1.3" fill="#cbd5e1" />
            <circle cx="44" cy="31" r="1.2" fill="#cbd5e1" />
            <circle cx="56" cy="29" r="1.2" fill="#cbd5e1" />

            {/* Rank Number Tag */}
            <rect x="42" y="80" width="16" height="12" rx="3" fill="#8c4e1f" stroke="#ffc078" strokeWidth="1" />
            <text x="50" y="89" textAnchor="middle" fill="#ffe8cc" fontSize="9" fontWeight="900" fontFamily="sans-serif">I</text>
          </svg>
        );

      // 2. Iron Strike - Palo de hierro en escudo plateado
      case 2:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="silverShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="steelBladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <radialGradient id="silverInner" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>
            </defs>

            {/* Knightly Silver Shield */}
            <path
              d="M 50 6 C 75 6, 88 12, 88 38 C 88 68, 50 94, 50 94 C 50 94, 12 68, 12 38 C 12 12, 25 6, 50 6 Z"
              fill="url(#silverShieldGrad)"
              stroke="#f1f5f9"
              strokeWidth="2.5"
            />
            {/* Inner Shield */}
            <path
              d="M 50 13 C 70 13, 81 18, 81 39 C 81 63, 50 86, 50 86 C 50 86, 19 63, 19 39 C 19 18, 30 13, 50 13 Z"
              fill="url(#silverInner)"
              stroke="#475569"
              strokeWidth="1.8"
            />

            {/* Crossed Iron Clubs */}
            <g transform="rotate(-30 50 50)">
              {/* Shaft */}
              <rect x="47" y="16" width="6" height="66" rx="2" fill="url(#steelBladeGrad)" stroke="#1e293b" strokeWidth="1" />
              {/* Grip */}
              <rect x="46.5" y="60" width="7" height="22" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              {/* Iron Club Head */}
              <path
                d="M 46 16 L 30 12 C 26 12, 24 16, 26 22 L 36 28 L 47 24 Z"
                fill="url(#steelBladeGrad)"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              {/* Grooves on iron face */}
              <line x1="30" y1="17" x2="40" y2="21" stroke="#334155" strokeWidth="1" />
              <line x1="31" y1="21" x2="39" y2="24" stroke="#334155" strokeWidth="1" />
            </g>

            {/* Spark Reflection */}
            <polygon points="50,30 53,38 61,41 53,44 50,52 47,44 39,41 47,38" fill="#ffffff" opacity="0.9" />

            {/* Rank Badge Tag */}
            <rect x="41" y="76" width="18" height="12" rx="3" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
            <text x="50" y="85" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="900" fontFamily="sans-serif">II</text>
          </svg>
        );

      // 3. Par Master - Lápiz y tarjeta con detalles en dorado
      case 3:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goldMasterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="scorecardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#fef3c7" />
              </linearGradient>
              <radialGradient id="goldInner" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="100%" stopColor="#1a0601" />
              </radialGradient>
            </defs>

            {/* Gold Hex Shield Frame */}
            <polygon
              points="50,4 88,24 88,76 50,96 12,76 12,24"
              fill="url(#goldMasterGrad)"
              stroke="#fef08a"
              strokeWidth="2.5"
            />
            <polygon
              points="50,11 81,28 81,72 50,89 19,72 19,28"
              fill="url(#goldInner)"
              stroke="#92400e"
              strokeWidth="1.8"
            />

            {/* Scorecard Paper */}
            <g transform="rotate(-8 46 48)">
              <rect x="25" y="24" width="42" height="50" rx="3" fill="url(#scorecardGrad)" stroke="#d97706" strokeWidth="1.5" />
              {/* Scorecard Table Lines */}
              <line x1="28" y1="34" x2="64" y2="34" stroke="#b45309" strokeWidth="1.2" />
              <line x1="28" y1="44" x2="64" y2="44" stroke="#d97706" strokeWidth="0.8" strokeDasharray="1,1" />
              <line x1="28" y1="54" x2="64" y2="54" stroke="#d97706" strokeWidth="0.8" strokeDasharray="1,1" />
              <line x1="28" y1="64" x2="64" y2="64" stroke="#d97706" strokeWidth="0.8" strokeDasharray="1,1" />
              {/* Checkmark and Scores */}
              <circle cx="35" cy="39" r="2.5" fill="#15803d" />
              <circle cx="45" cy="39" r="2.5" fill="#15803d" />
              <circle cx="55" cy="39" r="2.5" fill="#b91c1c" />
              <text x="46" y="30" textAnchor="middle" fill="#78350f" fontSize="5" fontWeight="900">SCORECARD</text>
            </g>

            {/* Golden Pencil Crossing Card */}
            <g transform="rotate(38 52 46)">
              {/* Pencil Body */}
              <rect x="52" y="16" width="6" height="58" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
              <rect x="54" y="16" width="2" height="58" fill="#fef08a" />
              {/* Ferrule & Eraser */}
              <rect x="51.5" y="70" width="7" height="6" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
              <rect x="51.5" y="76" width="7" height="8" rx="2" fill="#f43f5e" stroke="#9f1239" strokeWidth="0.8" />
              {/* Pencil Tip */}
              <polygon points="52,16 58,16 55,7" fill="#fde68a" stroke="#78350f" strokeWidth="0.8" />
              <polygon points="54,11 56,11 55,7" fill="#1e293b" />
            </g>

            {/* Rank Badge Tag */}
            <rect x="40" y="78" width="20" height="12" rx="3" fill="#78350f" stroke="#fde047" strokeWidth="1" />
            <text x="50" y="87" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="900" fontFamily="sans-serif">III</text>
          </svg>
        );

      // 4. Birdie Hunter - Pelota con alas en emblema verde
      case 4:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="emeraldFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="35%" stopColor="#10b981" />
                <stop offset="70%" stopColor="#047857" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
              <linearGradient id="featherGradLeft" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="60%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="featherGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="60%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <radialGradient id="greenInner" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </radialGradient>
              <radialGradient id="birdieBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </radialGradient>
            </defs>

            {/* Emerald Octagonal Shield */}
            <polygon
              points="50,5 86,16 94,50 86,84 50,95 14,84 6,50 14,16"
              fill="url(#emeraldFrameGrad)"
              stroke="#a7f3d0"
              strokeWidth="2.5"
            />
            <polygon
              points="50,11 80,21 87,50 80,79 50,89 20,79 13,50 20,21"
              fill="url(#greenInner)"
              stroke="#047857"
              strokeWidth="1.8"
            />

            {/* Left Majestic Wing */}
            <path
              d="M 40 45 C 32 30, 16 28, 14 34 C 18 42, 26 48, 38 52 C 24 54, 18 60, 22 66 C 28 66, 36 60, 42 56 Z"
              fill="url(#featherGradLeft)"
              stroke="#022c22"
              strokeWidth="1.2"
            />
            {/* Right Majestic Wing */}
            <path
              d="M 60 45 C 68 30, 84 28, 86 34 C 82 42, 74 48, 62 52 C 76 54, 82 60, 78 66 C 72 66, 64 60, 58 56 Z"
              fill="url(#featherGradRight)"
              stroke="#022c22"
              strokeWidth="1.2"
            />

            {/* Flying Golf Ball in Center */}
            <circle cx="50" cy="48" r="15" fill="url(#birdieBallGrad)" stroke="#047857" strokeWidth="2" />
            {/* Dimple matrix */}
            <circle cx="46" cy="44" r="1.3" fill="#94a3b8" />
            <circle cx="54" cy="44" r="1.3" fill="#94a3b8" />
            <circle cx="50" cy="49" r="1.4" fill="#94a3b8" />
            <circle cx="45" cy="52" r="1.2" fill="#94a3b8" />
            <circle cx="55" cy="52" r="1.2" fill="#94a3b8" />

            {/* Laurel Leaves Under Ball */}
            <path d="M 38 67 Q 50 74 62 67" stroke="#6ee7b7" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Rank Badge Tag */}
            <rect x="40" y="78" width="20" height="12" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
            <text x="50" y="87" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="900" fontFamily="sans-serif">IV</text>
          </svg>
        );

      // 5. Eagle Precision - Águila majestuosa sobre fondo azul
      case 5:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="eagleBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="35%" stopColor="#3b82f6" />
                <stop offset="70%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="eagleGoldFeathers" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <radialGradient id="eagleInnerBg" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
            </defs>

            {/* Royal Sapphire Shield */}
            <path
              d="M 50 4 C 78 4, 92 10, 92 40 C 92 72, 50 96, 50 96 C 50 96, 8 72, 8 40 C 8 10, 22 4, 50 4 Z"
              fill="url(#eagleBlueGrad)"
              stroke="#bfdbfe"
              strokeWidth="2.5"
            />
            <path
              d="M 50 10 C 73 10, 85 16, 85 41 C 85 67, 50 89, 50 89 C 50 89, 15 67, 15 41 C 15 16, 27 10, 50 10 Z"
              fill="url(#eagleInnerBg)"
              stroke="#1e40af"
              strokeWidth="1.8"
            />

            {/* Twin Victory Stars */}
            <polygon points="28,26 30,31 35,31 31,34 32,39 28,36 24,39 25,34 21,31 26,31" fill="#facc15" />
            <polygon points="72,26 74,31 79,31 75,34 76,39 72,36 68,39 69,34 65,31 70,31" fill="#facc15" />

            {/* Majestic Soaring Eagle */}
            <g transform="translate(0, -3)">
              {/* Wide Eagle Wings */}
              <path
                d="M 50 44 C 36 28, 14 26, 12 36 C 20 44, 32 48, 44 54 C 28 58, 20 66, 24 72 C 34 70, 44 62, 50 56 C 56 62, 66 70, 76 72 C 80 66, 72 58, 56 54 C 68 48, 80 44, 88 36 C 86 26, 64 28, 50 44 Z"
                fill="url(#eagleGoldFeathers)"
                stroke="#78350f"
                strokeWidth="1.2"
              />
              {/* Eagle Head Profile */}
              <path
                d="M 50 25 C 46 25, 43 28, 44 34 L 46 36 L 40 40 L 46 41 C 48 45, 52 46, 56 42 C 58 36, 56 25, 50 25 Z"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {/* Golden Hooked Beak */}
              <path d="M 46 36 L 38 38 C 36 40, 40 42, 44 41 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
              {/* Piercing Eye */}
              <circle cx="48" cy="33" r="1.4" fill="#0f172a" />
              <circle cx="48.5" cy="32.5" r="0.5" fill="#ffffff" />
            </g>

            {/* Target Pin Under Eagle */}
            <circle cx="50" cy="74" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="50" cy="74" r="2" fill="#ffffff" />

            {/* Rank Badge Tag */}
            <rect x="40" y="80" width="20" height="12" rx="3" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
            <text x="50" y="89" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="900" fontFamily="sans-serif">V</text>
          </svg>
        );

      // 6. Albatross - Albatros legendario con aureola violeta
      case 6:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="albatrossVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="30%" stopColor="#c084fc" />
                <stop offset="70%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
              <linearGradient id="celestialWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e9d5ff" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <radialGradient id="mysticInnerBg" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#581c87" />
                <stop offset="70%" stopColor="#2e1065" />
                <stop offset="100%" stopColor="#0f021c" />
              </radialGradient>
              <filter id="haloGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Mystic Violet Crown Frame */}
            <polygon
              points="50,4 78,14 94,40 88,78 50,96 12,78 6,40 22,14"
              fill="url(#albatrossVioletGrad)"
              stroke="#e9d5ff"
              strokeWidth="2.5"
            />
            <polygon
              points="50,10 73,19 87,41 81,73 50,89 19,73 13,41 27,19"
              fill="url(#mysticInnerBg)"
              stroke="#7c3aed"
              strokeWidth="1.8"
            />

            {/* Glowing Ethereal Violet Halo */}
            <ellipse
              cx="50"
              cy="25"
              rx="24"
              ry="9"
              fill="none"
              stroke="#d8b4fe"
              strokeWidth="3.5"
              filter="url(#haloGlow)"
            />
            <ellipse
              cx="50"
              cy="25"
              rx="24"
              ry="9"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
            />

            {/* Celestial Stars */}
            <polygon points="50,12 51,15 54,15 52,17 53,20 50,18 47,20 48,17 46,15 49,15" fill="#ffffff" />
            <circle cx="28" cy="36" r="1.5" fill="#f3e8ff" />
            <circle cx="72" cy="36" r="1.5" fill="#f3e8ff" />

            {/* Legendary Gliding Albatross Bird */}
            <g transform="translate(0, 10)">
              {/* Massive Sweeping Glider Wings */}
              <path
                d="M 50 32 C 34 16, 12 18, 8 28 C 16 32, 28 34, 42 42 C 26 44, 18 50, 22 56 C 32 54, 42 48, 50 44 C 58 48, 68 54, 78 56 C 82 50, 74 44, 58 42 C 72 34, 84 32, 92 28 C 88 18, 66 16, 50 32 Z"
                fill="url(#celestialWingGrad)"
                stroke="#3b0764"
                strokeWidth="1.2"
              />
              {/* Smooth Sleek Albatross Head & Body */}
              <path
                d="M 50 18 C 47 18, 45 22, 46 26 L 47 28 L 44 31 L 48 31 C 48 36, 52 38, 50 48 L 50 56 L 52 48 C 50 38, 54 36, 54 31 L 57 31 L 55 28 L 56 26 C 57 22, 53 18, 50 18 Z"
                fill="#ffffff"
                stroke="#581c87"
                strokeWidth="1"
              />
              {/* Amber Pointed Beak */}
              <polygon points="49,18 51,18 50,11" fill="#f59e0b" stroke="#78350f" strokeWidth="0.6" />
            </g>

            {/* Mystic Orb at Bottom */}
            <circle cx="50" cy="74" r="6" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="50" cy="74" r="3" fill="#ffffff" />

            {/* Rank Badge Tag */}
            <rect x="39" y="80" width="22" height="12" rx="3" fill="#2e1065" stroke="#c084fc" strokeWidth="1" />
            <text x="50" y="89" textAnchor="middle" fill="#f3e8ff" fontSize="9" fontWeight="900" fontFamily="sans-serif">VI</text>
          </svg>
        );

      // 7. Hole in One - Copa y pelota en hoyo con marco brillante
      case 7:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="diamondCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="75%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="goldTrophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <radialGradient id="cosmicHoleGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="70%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#431407" />
              </radialGradient>
              <radialGradient id="sunburstGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Sparkling Sunburst Ray Behind Trophy */}
            <g opacity="0.75">
              <polygon points="50,50 47,8 53,8" fill="#fde047" />
              <polygon points="50,50 82,18 86,22" fill="#fde047" />
              <polygon points="50,50 92,47 92,53" fill="#fde047" />
              <polygon points="50,50 82,82 78,86" fill="#fde047" />
              <polygon points="50,50 47,92 53,92" fill="#fde047" />
              <polygon points="50,50 18,82 22,86" fill="#fde047" />
              <polygon points="50,50 8,47 8,53" fill="#fde047" />
              <polygon points="50,50 18,18 22,14" fill="#fde047" />
            </g>

            {/* Radiant Diamond & Gold Frame */}
            <path
              d="M 50 3 L 78 8 L 95 32 L 95 68 L 78 92 L 50 97 L 22 92 L 5 68 L 5 32 L 22 8 Z"
              fill="url(#diamondCrownGrad)"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <path
              d="M 50 9 L 74 14 L 88 35 L 88 65 L 74 86 L 50 91 L 26 86 L 12 65 L 12 35 L 26 14 Z"
              fill="url(#cosmicHoleGrad)"
              stroke="#fbbf24"
              strokeWidth="1.8"
            />

            {/* Corner Diamond Sparkles */}
            <polygon points="50,4 52,9 57,9 53,12 55,17 50,14 45,17 47,12 43,9 48,9" fill="#ffffff" />
            <polygon points="90,32 91,35 94,35 92,37 93,40 90,38 87,40 88,37 86,35 89,35" fill="#ffffff" />
            <polygon points="10,32 11,35 14,35 12,37 13,40 10,38 7,40 8,37 6,35 9,35" fill="#ffffff" />

            {/* Putting Green Cup with Flag #1 and Dropping Ball */}
            {/* The Putting Hole */}
            <ellipse cx="50" cy="72" rx="20" ry="7" fill="#000000" stroke="#f59e0b" strokeWidth="1.5" />

            {/* Flagpole and Flag 1 */}
            <line x1="50" y1="72" x2="50" y2="20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 20 L 72 27 L 50 34 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            <text x="56" y="29" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">1</text>

            {/* Grand Golden Trophy Cup */}
            <g transform="translate(0, 4)">
              {/* Cup Handles */}
              <path d="M 32 36 C 22 36, 22 50, 34 50" fill="none" stroke="url(#goldTrophyGrad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 68 36 C 78 36, 78 50, 66 50" fill="none" stroke="url(#goldTrophyGrad)" strokeWidth="3" strokeLinecap="round" />
              {/* Cup Body */}
              <path
                d="M 33 32 L 67 32 C 67 46, 59 56, 50 56 C 41 56, 33 46, 33 32 Z"
                fill="url(#goldTrophyGrad)"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              {/* Cup Stem & Base */}
              <rect x="47" y="56" width="6" height="8" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
              <path d="M 40 64 L 60 64 L 64 68 L 36 68 Z" fill="url(#goldTrophyGrad)" stroke="#78350f" strokeWidth="1" />
            </g>

            {/* Sinking Ball with Motion Streak */}
            <line x1="62" y1="58" x2="52" y2="69" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2,2" />
            <circle cx="52" cy="69" r="6" fill="#ffffff" stroke="#eab308" strokeWidth="1.5" />
            <circle cx="50" cy="67" r="1" fill="#94a3b8" />
            <circle cx="54" cy="67" r="1" fill="#94a3b8" />

            {/* Rank Badge Tag */}
            <rect x="36" y="80" width="28" height="13" rx="4" fill="#000000" stroke="#fde047" strokeWidth="1.5" />
            <text x="50" y="90" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">
              👑 VII
            </text>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        showGlow ? 'filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]' : ''
      } ${animate ? 'hover:scale-110 transition-transform duration-200 cursor-pointer' : ''} ${className}`}
    >
      {renderLogoContent()}
    </div>
  );
};

interface RankBadgeProps {
  rp?: number;
  tier?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  showName?: boolean;
  showRP?: boolean;
  showDescription?: boolean;
  className?: string;
  onClick?: () => void;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rp = 0,
  tier,
  size = 'md',
  showName = true,
  showRP = false,
  showDescription = false,
  className = '',
  onClick
}) => {
  const rank: RankTier = tier ? (getRankFromRP(0), (getRankFromRP(rp).tier === tier ? getRankFromRP(rp) : getRankFromRP(0))) : getRankFromRP(rp);
  const actualRank = tier ? (getRankFromRP((tier - 1) * 600)) : rank;

  const sizeConfigs = {
    xs: { iconSize: 20, textSize: 'text-[10px]', padding: 'px-1.5 py-0.5' },
    sm: { iconSize: 28, textSize: 'text-xs', padding: 'px-2 py-1' },
    md: { iconSize: 38, textSize: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { iconSize: 56, textSize: 'text-base', padding: 'px-4 py-2.5' },
    hero: { iconSize: 84, textSize: 'text-xl', padding: 'px-6 py-4' }
  };

  const config = sizeConfigs[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border transition-all ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-98' : ''
      } ${config.padding} ${className}`}
      style={{
        backgroundColor: actualRank.badgeBg,
        borderColor: actualRank.borderColor,
        boxShadow: `0 2px 10px ${actualRank.glowColor}`
      }}
    >
      <RankLogo tier={actualRank.tier} size={config.iconSize} showGlow={actualRank.tier >= 6} />

      {(showName || showRP || showDescription) && (
        <div className="flex flex-col min-w-0">
          {showName && (
            <div className="flex items-center gap-1.5">
              <span
                className={`font-black uppercase tracking-wider truncate ${config.textSize}`}
                style={{ color: actualRank.textColor }}
              >
                {actualRank.name}
              </span>
              <span
                className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: actualRank.borderColor,
                  color: actualRank.tier === 7 ? '#000000' : '#ffffff'
                }}
              >
                Rango {actualRank.tier}
              </span>
            </div>
          )}

          {showRP && (
            <span className="text-[11px] font-mono font-bold text-stone-300">
              {rp.toLocaleString()} RP
            </span>
          )}

          {showDescription && (
            <span className="text-[10px] text-stone-400 font-medium truncate max-w-[200px]">
              {actualRank.logoDescription}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
