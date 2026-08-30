/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RANKS_DATA, getRankFromRP, getRankProgress, RankTier, getLocalizedRankTier } from './RankData';
import { RankLogo, RankBadge } from './RankBadges';
import { Language, t } from '../utils/translations';
import { 
  Trophy, 
  Shield, 
  Zap, 
  Award, 
  ChevronRight, 
  X, 
  Star, 
  Flame, 
  Swords, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface RanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRP: number;
  onPlayOnline?: () => void;
  language?: Language;
}

export const RanksModal: React.FC<RanksModalProps> = ({
  isOpen,
  onClose,
  currentRP = 0,
  onPlayOnline,
  language = 'es'
}) => {
  const [selectedRankTier, setSelectedRankTier] = useState<number>(() => {
    return getRankFromRP(currentRP).tier;
  });

  if (!isOpen) return null;

  const rawCurrentRank = getRankFromRP(currentRP);
  const currentRank = getLocalizedRankTier(rawCurrentRank, language);
  const progress = getRankProgress(currentRP);
  const rawSelectedRank = RANKS_DATA.find(r => r.tier === selectedRankTier) || rawCurrentRank;
  const selectedRank = getLocalizedRankTier(rawSelectedRank, language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#241c17] text-[#faf6ee] rounded-3xl border-2 border-[#3d312a] shadow-2xl flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#2f251f] border-b border-[#4d3f35] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {t('ranks_title', language)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {t('menu_view7Ranks', language)}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#3d312a] hover:bg-[#4d3e35] text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Player Progress Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2c1e16] via-[#3a291e] to-[#2c1e16] border-b border-[#4d3f35] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="relative">
              <RankLogo tier={currentRank.tier} size={58} showGlow />
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full border border-black">
                T{currentRank.tier}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-amber-300/80">{t('menu_yourRank', language)}</span>
              <h3 className="text-lg font-black text-white leading-tight">
                {currentRank.name}
              </h3>
              <p className="text-xs font-mono font-bold text-stone-300">
                {currentRP.toLocaleString()} RP <span className="text-stone-500 font-sans">({currentRank.logoDescription})</span>
              </p>
            </div>
          </div>

          {/* RP Progress Bar */}
          <div className="w-full sm:w-80 bg-[#1c140f] p-3 rounded-2xl border border-[#4d3f35] space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-black">
              <span className="text-stone-400">{t('ranks_currentProgress', language)}</span>
              <span className="text-amber-400 font-mono">
                {progress.nextRank ? `${progress.percentage}%` : t('ranks_maxRankReached', language)}
              </span>
            </div>
            <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden p-0.5 border border-stone-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500 shadow-sm"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-400 font-medium">
              <span>{currentRank.minRP} RP</span>
              {progress.nextRank ? (
                <span>{progress.rpRequiredForNext} RP {t('mp_of', language)} {getLocalizedRankTier(progress.nextRank, language).name}</span>
              ) : (
                <span className="text-amber-300 font-bold">★ {t('ranks_maxRankReached', language)}</span>
              )}
              <span>{progress.nextRank ? progress.nextRank.minRP : 'Max'} RP</span>
            </div>
          </div>
        </div>

        {/* Content Body: Left Ranks List, Right Detailed Card */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 7 Ranks List Column */}
          <div className="md:col-span-5 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-stone-400 block px-1">
              {t('menu_view7Ranks', language)}
            </span>

            <div className="space-y-2">
              {RANKS_DATA.map((rawRank) => {
                const rank = getLocalizedRankTier(rawRank, language);
                const isCurrent = rank.tier === currentRank.tier;
                const isSelected = rank.tier === selectedRank.tier;
                const isUnlocked = currentRP >= rank.minRP;

                return (
                  <button
                    key={rank.tier}
                    type="button"
                    onClick={() => setSelectedRankTier(rank.tier)}
                    className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-[#3d2e24] shadow-md scale-[1.01]'
                        : 'border-[#423429] bg-[#2a201a] hover:bg-[#342720]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <RankLogo tier={rank.tier} size={42} showGlow={isSelected || rank.tier >= 6} />
                        {isCurrent && (
                          <span className="absolute -top-1 -left-1 bg-emerald-500 text-black text-[8px] font-black px-1.5 rounded-full border border-black animate-pulse">
                            {t('lb_you', language)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-stone-400">#{rank.tier}</span>
                          <h4 
                            className="text-xs sm:text-sm font-black truncate"
                            style={{ color: rank.textColor }}
                          >
                            {rank.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">
                          {rank.logoDescription}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-black text-amber-400/90 block">
                        {rank.minRP}+ RP
                      </span>
                      {isUnlocked ? (
                        <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-0.5 justify-end">
                          <CheckCircle2 className="w-2.5 h-2.5" /> {t('store_owned', language)}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-stone-500">
                          {t('store_locked', language)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Selected Rank Showcase */}
          <div className="md:col-span-7 flex flex-col justify-between bg-[#2f231c] border border-[#4d3d31] rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="space-y-4">
              {/* Big Logo Hero Frame */}
              <div 
                className="p-6 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden"
                style={{
                  backgroundColor: selectedRank.badgeBg,
                  borderColor: selectedRank.borderColor,
                  boxShadow: `0 4px 20px ${selectedRank.glowColor}`
                }}
              >
                <div className="relative z-10 flex flex-col items-center">
                  <RankLogo tier={selectedRank.tier} size={110} showGlow animate />
                  <span 
                    className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full mt-3 border"
                    style={{
                      backgroundColor: selectedRank.borderColor,
                      color: selectedRank.tier === 7 ? '#000000' : '#ffffff',
                      borderColor: '#ffffff33'
                    }}
                  >
                    {t('ranks_tier', language)} {selectedRank.tier} • {selectedRank.name}
                  </span>
                </div>

                {/* Subtle Radial Glow */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${selectedRank.accentColor}, transparent 70%)`
                  }}
                />
              </div>

              {/* Logo Description & Lore */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#4d3d31] pb-2">
                  <span className="text-xs font-black uppercase text-stone-400">{t('ranks_title', language)}</span>
                  <span className="text-xs font-black text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-lg">
                    {selectedRank.logoDescription}
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {selectedRank.description}
                </p>
              </div>

              {/* RP Range & Status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-[#1e1611] rounded-xl border border-[#423328]">
                  <span className="text-[10px] font-black uppercase text-stone-400 block">{t('mp_playerRankedPoints', language)}</span>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {selectedRank.minRP} - {selectedRank.maxRP === 99999 ? '∞' : selectedRank.maxRP} RP
                  </span>
                </div>

                <div className="p-3 bg-[#1e1611] rounded-xl border border-[#423328]">
                  <span className="text-[10px] font-black uppercase text-stone-400 block">{t('menu_yourRank', language)}</span>
                  <span className="font-bold text-sm">
                    {currentRank.tier >= selectedRank.tier ? (
                      <span className="text-emerald-400 font-black">✓ {t('store_owned', language)}</span>
                    ) : (
                      <span className="text-stone-400">{selectedRank.minRP - currentRP} RP {t('mp_of', language)} {selectedRank.name}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Perks / Benefits */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase text-stone-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> {t('ach_title', language)} & {selectedRank.rewardPerWin || '+30 RP / Win'}
                </span>
                <div className="space-y-1">
                  {selectedRank.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-300 bg-[#221913] px-3 py-1.5 rounded-lg border border-[#3d2e24]">
                      <Star className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action CTA */}
            {onPlayOnline && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlayOnline();
                }}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all active:scale-98 cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>{t('ranks_playMultiplayer', language)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-[#1f1712] border-t border-[#4d3f35] flex items-center justify-between text-xs text-stone-400 flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t('ranks_subtitle', language)}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3d312a] hover:bg-[#4d3e35] text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            {t('acc_dismiss', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

