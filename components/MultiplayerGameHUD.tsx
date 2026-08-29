/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MultiplayerRoom, 
  MultiplayerPlayer, 
  sendEmote, 
  leaveRoom 
} from '../services/multiplayerService';
import { RankLogo } from './RankBadges';
import { getRankFromRP } from './RankData';
import { 
  Trophy, 
  Swords, 
  Smile, 
  Flag, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  LogOut,
  Flame,
  Award
} from 'lucide-react';

export interface MultiplayerGameHUDProps {
  room: MultiplayerRoom;
  currentUserId: string;
  currentLevelPar?: number;
  currentStrokes?: number;
  onSendEmote?: (emoji: string) => void;
  onLeaveMatch?: () => void;
  onNextHole?: () => void;
  onExitMultiplayer?: () => void;
  onRPUpdated?: (newRP: number, wonMatch?: boolean) => void;
}

const QUICK_EMOTES = [
  { emoji: '🔥', text: '¡Buen tiro!' },
  { emoji: '⛳', text: '¡Hole in One!' },
  { emoji: '👏', text: '¡Buena partida!' },
  { emoji: '🎯', text: '¡Puntería perfecta!' },
  { emoji: '😱', text: '¡No puede ser!' },
  { emoji: '🏆', text: '¡GG!' },
  { emoji: '😂', text: 'Jajaja' },
  { emoji: '🍀', text: '¡Buena suerte!' },
];

export const MultiplayerGameHUD: React.FC<MultiplayerGameHUDProps> = ({
  room,
  currentUserId,
  currentLevelPar,
  currentStrokes,
  onSendEmote,
  onLeaveMatch,
  onNextHole,
  onExitMultiplayer,
  onRPUpdated,
}) => {
  const [showEmotePicker, setShowEmotePicker] = useState(false);
  const [activeEmotes, setActiveEmotes] = useState<Array<{ id: string; name: string; emoji: string; text: string }>>([]);

  const handleExit = () => {
    if (onLeaveMatch) onLeaveMatch();
    else if (onExitMultiplayer) onExitMultiplayer();
  };

  const playersList = Object.values(room.players || {});
  const me = room.players?.[currentUserId];

  // Emotes listener
  useEffect(() => {
    if (room.emotes && room.emotes.length > 0) {
      const latest = room.emotes[room.emotes.length - 1];
      if (Date.now() - latest.timestamp < 4000) {
        setActiveEmotes(prev => {
          if (prev.some(e => e.id === latest.id)) return prev;
          return [...prev.slice(-3), { id: latest.id, name: latest.senderName, emoji: latest.emoji, text: latest.text }];
        });

        // Auto expire after 3.5s
        setTimeout(() => {
          setActiveEmotes(prev => prev.filter(e => e.id !== latest.id));
        }, 3500);
      }
    }
  }, [room.emotes]);

  // Trigger RP update once if match is finished
  useEffect(() => {
    if (room.status === 'finished' && room.results?.rankings && onRPUpdated) {
      const myResult = room.results.rankings.find(r => r.uid === currentUserId);
      if (myResult) {
        onRPUpdated(myResult.newRP, room.winnerUid === currentUserId);
      }
    }
  }, [room.status, room.results, currentUserId, onRPUpdated, room.winnerUid]);

  const handleSendEmote = (emoji: string, text: string) => {
    if (!me) return;
    if (onSendEmote) {
      onSendEmote(emoji);
    }
    sendEmote(room.id, currentUserId, me.displayName, emoji, text);
    setShowEmotePicker(false);
  };

  // 1. MATCH FINISHED PODIUM MODAL
  if (room.status === 'finished' && room.results?.rankings) {
    const rankings = room.results.rankings;
    const isWinner = room.winnerUid === currentUserId;
    const myResult = rankings.find(r => r.uid === currentUserId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 font-sans">
        <div className="w-full max-w-lg bg-[#271d17] border-2 border-amber-500/80 rounded-3xl p-6 sm:p-7 text-center shadow-2xl space-y-5 text-[#faf6ee]">
          {/* Winner Fanfare */}
          <div className="relative">
            <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-3xl mx-auto flex items-center justify-center border border-amber-500/50 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>
            {isWinner && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[10px] font-black uppercase px-3 py-0.5 rounded-full border border-black shadow-md">
                👑 ¡VICTORIA!
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isWinner ? '¡Has Ganado el Duelo!' : 'Partida Finalizada'}
            </h2>
            <p className="text-xs text-stone-300 font-semibold mt-1">
              Resultados del circuito competitivo de {room.holeCount} hoyos
            </p>
          </div>

          {/* RP Adjustment Card for Current Player */}
          {myResult && (
            <div className="bg-[#1c140f] p-4 rounded-2xl border border-[#4d3d31] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankLogo tier={myResult.rankTier} size={46} showGlow />
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase text-amber-300">
                    {getRankFromRP(myResult.newRP).name}
                  </span>
                  <div className="text-sm font-mono font-black text-white">
                    {myResult.newRP} RP
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-mono font-black ${myResult.rpChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {myResult.rpChange >= 0 ? `+${myResult.rpChange}` : myResult.rpChange} RP
                </span>
                <span className="text-[10px] font-bold text-stone-400 block">
                  Puntaje Clasificatorio
                </span>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="space-y-2 text-left">
            <span className="text-[11px] font-black uppercase text-stone-400 block px-1">
              Tabla de Posiciones
            </span>
            <div className="space-y-1.5">
              {rankings.map((r, idx) => (
                <div
                  key={r.uid}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    idx === 0
                      ? 'bg-amber-500/15 border-amber-500/50 text-white'
                      : 'bg-[#1e1611] border-[#3d2e24] text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-xs text-amber-400 w-5">
                      #{idx + 1}
                    </span>
                    <RankLogo tier={r.rankTier} size={28} />
                    <span className="font-black text-xs truncate max-w-[140px]">
                      {r.displayName} {r.uid === currentUserId && '(Tú)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span>{r.totalStrokes} Golpes</span>
                    <span className={r.rpChange >= 0 ? 'text-emerald-400 font-black' : 'text-red-400'}>
                      {r.rpChange >= 0 ? `+${r.rpChange}` : r.rpChange} RP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <span>Continuar al Menú</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. LIVE IN-GAME TOP HUD & EMOTE WHEEL
  return (
    <>
      {/* Floating Active Emotes over screen */}
      <div className="absolute top-20 left-4 z-40 space-y-2 pointer-events-none">
        {activeEmotes.map((e) => (
          <div
            key={e.id}
            className="bg-[#241a13]/90 text-white border border-amber-500/60 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-left-4 fade-in duration-200"
          >
            <span className="text-xl">{e.emoji}</span>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-amber-300 block leading-tight">
                {e.name}
              </span>
              <span className="text-xs font-bold">{e.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Header Match Bar */}
      <div className="absolute top-2 inset-x-2 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Match / Hole Info */}
        <div className="bg-[#271d17]/95 border border-[#4d3d31] backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-amber-400" />
            <span className="font-black text-xs text-white">
              Hoyo {room.currentHoleIndex + 1}/{room.holeCount}
            </span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <span className="text-[10px] font-black uppercase text-amber-300/90 tracking-wider">
            {room.mode === 'ranked_1v1' ? '⚔️ Duelo 1v1' : '🏌️ Online'}
          </span>
        </div>

        {/* Live Players Stroke Scoreboard */}
        <div className="bg-[#271d17]/95 border border-[#4d3d31] backdrop-blur-md p-1.5 px-3 rounded-2xl shadow-lg flex items-center gap-3 pointer-events-auto">
          {playersList.map((p) => {
            const isMe = p.uid === currentUserId;
            const pRank = getRankFromRP(p.rp);

            return (
              <div key={p.uid} className="flex items-center gap-2">
                <RankLogo tier={pRank.tier} size={24} />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-white truncate max-w-[80px]">
                      {p.displayName}
                    </span>
                    {isMe && <span className="text-[8px] bg-emerald-500 text-black px-1 rounded font-black">TÚ</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-amber-400 font-bold">{p.strokes || 0}g</span>
                    <span className="text-stone-400">({p.totalStrokes || 0} tot)</span>
                    {p.hasFinishedHole && (
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-950/80 px-1 rounded">
                        ✓ HOYO
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave Match Button */}
        <button
          type="button"
          onClick={handleExit}
          className="bg-[#271d17]/95 hover:bg-red-900/80 text-stone-300 hover:text-white border border-[#4d3d31] p-2 rounded-2xl shadow-lg transition-colors pointer-events-auto cursor-pointer"
          title="Salir de la partida"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Right Emote Reactions Wheel / Button */}
      <div className="absolute bottom-20 right-3 z-30">
        {showEmotePicker ? (
          <div className="bg-[#241a13] border-2 border-amber-500/70 p-2.5 rounded-3xl shadow-2xl grid grid-cols-4 gap-1.5 animate-in zoom-in-95 duration-150 mb-2">
            {QUICK_EMOTES.map((em, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendEmote(em.emoji, em.text)}
                className="p-2 bg-[#33241b] hover:bg-amber-500 hover:text-black rounded-xl text-center transition-all active:scale-90 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                title={em.text}
              >
                <span className="text-xl leading-none">{em.emoji}</span>
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowEmotePicker(prev => !prev)}
          className="w-11 h-11 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg border-2 border-amber-300 transition-transform active:scale-95 cursor-pointer ml-auto"
          title="Enviar Reacción Rápida"
        >
          <Smile className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};
