/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, Coins, Check, Sparkles, X, Trophy, Calendar, Zap, Gift } from 'lucide-react';
import { DailyStreakData, STREAK_TIERS, getRewardForStreakDay } from '../services/streakService';
import { Language, t } from '../utils/translations';

interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakData: DailyStreakData;
  newRewardAwarded?: number;
  language?: Language;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  onClose,
  streakData,
  newRewardAwarded,
  language = 'es',
}) => {
  if (!isOpen) return null;

  const currentDay = streakData.streakCount || 1;
  const cycleDay = ((currentDay - 1) % 7) + 1; // 1 to 7

  const isSpanish = language === 'es';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-[#faf6ee] text-[#3d312a] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header with Flame Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-xs">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-200 animate-pulse" />
            <span>{isSpanish ? 'Racha de Inicio Diario' : 'Daily Login Streak'}</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight drop-shadow-sm flex items-center justify-center gap-2">
            <span>{isSpanish ? '¡Día' : 'Day'} {currentDay}</span>
            <span className="text-amber-200">🔥</span>
          </h2>

          <p className="text-xs text-amber-100 font-semibold mt-1 max-w-xs mx-auto">
            {isSpanish
              ? '¡Vuelve cada día consecutivo para acumular más monedas y recompensas legendarias!'
              : 'Return every consecutive day to accumulate more coins and legendary rewards!'}
          </p>

          {/* New Reward Celebration Banner */}
          {newRewardAwarded !== undefined && newRewardAwarded > 0 && (
            <div className="mt-3.5 bg-amber-950/40 border border-amber-300/40 rounded-2xl p-3 flex items-center justify-center gap-2.5 animate-bounce">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md">
                🪙
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">
                  {isSpanish ? '¡Recompensa Reclamada Hoy!' : 'Reward Claimed Today!'}
                </span>
                <span className="text-sm font-black text-white">
                  +{newRewardAwarded} {isSpanish ? 'Monedas añadidas a tu saldo' : 'Coins added to your bank'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 7-Day Streak Calendar Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#3d312a] uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{isSpanish ? 'Calendario de 7 Días' : '7-Day Streak Track'}</span>
            </div>
            <span className="text-[11px] font-bold text-[#7a7065]">
              {isSpanish ? 'Días totales completados:' : 'Total days claimed:'} <b className="text-amber-600 font-black">{streakData.totalDaysClaimed || currentDay}</b>
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {STREAK_TIERS.map((tier) => {
              const isPastClaimed = tier.day < cycleDay;
              const isToday = tier.day === cycleDay;
              const isFuture = tier.day > cycleDay;

              return (
                <div
                  key={tier.day}
                  className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all border ${
                    isToday
                      ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-amber-500 ring-2 ring-amber-400/40 shadow-md scale-102'
                      : isPastClaimed
                      ? 'bg-emerald-500/10 border-emerald-500/30 opacity-90'
                      : 'bg-[#efe6d4]/60 border-[#3d312a]/10'
                  }`}
                >
                  {/* Status Indicator Pill */}
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#7a7065]">
                    {isSpanish ? `Día ${tier.day}` : `Day ${tier.day}`}
                  </span>

                  {/* Icon */}
                  <div className="my-1.5">
                    {isPastClaimed ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : isToday ? (
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md animate-pulse">
                        <Flame className="w-4 h-4 fill-white" />
                      </div>
                    ) : tier.isMilestone ? (
                      <div className="w-7 h-7 rounded-full bg-amber-400/30 text-amber-700 flex items-center justify-center">
                        <Trophy className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#3d312a]/5 text-[#7a7065] flex items-center justify-center">
                        <Gift className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Coins Amount */}
                  <div className="flex items-center gap-0.5 font-black text-xs text-[#3d312a]">
                    <span>🪙</span>
                    <span>+{tier.rewardCoins}</span>
                  </div>

                  {/* Tag label */}
                  {isToday && (
                    <span className="mt-1 bg-amber-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      {isSpanish ? 'HOY' : 'TODAY'}
                    </span>
                  )}
                  {isPastClaimed && (
                    <span className="mt-1 text-emerald-600 text-[8px] font-black uppercase">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Milestone Details Card */}
          <div className="bg-[#efe6d4]/70 border border-[#3d312a]/10 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-xs text-[#3d312a]">
                {isSpanish ? 'Bono Consecutivo Continuo' : 'Continuous Consecutive Streak Bonus'}
              </h4>
              <p className="text-[11px] text-[#7a7065] font-semibold leading-relaxed mt-0.5">
                {isSpanish
                  ? '¡Mantén tu racha más allá del día 7 para recibir 600 monedas + bonos de veterano cada día sin reiniciar!'
                  : 'Keep your streak beyond Day 7 to receive 600 coins + veteran bonuses every single day without resetting!'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-[#efe6d4]/50 border-t border-[#3d312a]/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {isSpanish ? '¡A Jugar Hoy!' : 'Continue Playing!'}
          </button>
        </div>
      </div>
    </div>
  );
};
