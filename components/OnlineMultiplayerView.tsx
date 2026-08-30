/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Users, 
  Plus, 
  LogIn, 
  Trophy, 
  Copy, 
  Check, 
  Play, 
  Bot, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  Zap,
  Award
} from 'lucide-react';
import { 
  MultiplayerRoom, 
  createRoom, 
  joinRoom, 
  quickMatchmake, 
  startMatch, 
  leaveRoom, 
  addBotOpponentToRoom,
  sendEmote 
} from '../services/multiplayerService';
import { RankBadge, RankLogo } from './RankBadges';
import { getRankFromRP, getLocalizedRankTier } from './RankData';
import { Language, t } from '../utils/translations';

interface OnlineMultiplayerViewProps {
  currentUser: {
    uid: string;
    displayName: string;
    email?: string;
  };
  playerRP: number;
  equippedBallId?: string;
  equippedTrailId?: string;
  levelIds: number[];
  onStartMatch: (room: MultiplayerRoom) => void;
  onOpenRanksModal: () => void;
  onBackToMenu: () => void;
  language?: Language;
}

export const OnlineMultiplayerView: React.FC<OnlineMultiplayerViewProps> = ({
  currentUser,
  playerRP = 0,
  equippedBallId = 'classic',
  equippedTrailId = 'classic',
  levelIds,
  onStartMatch,
  onOpenRanksModal,
  onBackToMenu,
  language = 'es',
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'create' | 'join'>('quick');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [holeCountChoice, setHoleCountChoice] = useState<number>(3);
  const [modeChoice, setModeChoice] = useState<'ranked_1v1' | 'casual_4p'>('ranked_1v1');
  
  // Matchmaking / Room State
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [matchCountdown, setMatchCountdown] = useState<number | null>(null);

  const playerRank = getRankFromRP(playerRP);

  // Matchmaking Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTimer(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Handle Quick Match
  const handleQuickMatch = async () => {
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const room = await quickMatchmake(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          rp: playerRP,
          ballSkin: equippedBallId,
          trailSkin: equippedTrailId,
        },
        levelIds
      );
      setCurrentRoom(room);

      const pCount = Object.keys(room.players || {}).length;
      if (pCount >= 2) {
        // Opponent found! Trigger start
        triggerMatchCountdown(room);
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Error al buscar partida.");
      setIsSearching(false);
    }
  };

  // Handle Create Room
  const handleCreateRoom = async () => {
    setErrorMessage(null);
    try {
      const room = await createRoom(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          rp: playerRP,
          ballSkin: equippedBallId,
          trailSkin: equippedTrailId,
        },
        {
          mode: modeChoice,
          holeCount: holeCountChoice,
          levelIds: levelIds,
        }
      );
      setCurrentRoom(room);
    } catch (e: any) {
      setErrorMessage(e.message || "Error al crear la sala.");
    }
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setErrorMessage("Por favor ingresa un código de sala.");
      return;
    }
    setErrorMessage(null);
    try {
      const room = await joinRoom(roomCodeInput, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        rp: playerRP,
        ballSkin: equippedBallId,
        trailSkin: equippedTrailId,
      });
      if (room) {
        setCurrentRoom(room);
        const pCount = Object.keys(room.players || {}).length;
        if (pCount >= 2 && room.mode === 'ranked_1v1') {
          triggerMatchCountdown(room);
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || "No se pudo unir a la sala.");
    }
  };

  // Countdown animation when 2 players connect
  const triggerMatchCountdown = (room: MultiplayerRoom) => {
    setIsSearching(false);
    setMatchCountdown(3);
    const countInterval = setInterval(() => {
      setMatchCountdown(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(countInterval);
          startMatch(room.id);
          onStartMatch(room);
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  };

  // Add Bot Opponent for instant play
  const handleAddBot = () => {
    if (!currentRoom) return;
    const updated = addBotOpponentToRoom(currentRoom);
    setCurrentRoom({ ...updated });
    triggerMatchCountdown(updated);
  };

  const handleCopyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeaveCurrentRoom = () => {
    if (currentRoom) {
      leaveRoom(currentRoom.id, currentUser.uid);
      setCurrentRoom(null);
      setIsSearching(false);
      setMatchCountdown(null);
    }
  };

  // 1. LOBBY / ROOM WAITING VIEW
  if (currentRoom) {
    const playersList = Object.values(currentRoom.players || {});
    const isHost = currentRoom.hostUid === currentUser.uid;

    return (
      <div className="w-full h-full bg-[#1e1713] text-[#faf6ee] flex flex-col items-center justify-between p-4 sm:p-6 font-sans overflow-y-auto">
        <div className="w-full max-w-3xl space-y-4 my-auto">
          {/* Room Header */}
          <div className="bg-[#2c221b] border-2 border-[#4d3d31] p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeaveCurrentRoom}
                className="p-2.5 bg-[#3d312a] hover:bg-[#4d3e35] text-stone-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Abandonar Sala"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full inline-block mb-0.5">
                  {currentRoom.mode === 'ranked_1v1' ? '⚔️ Duelo 1v1 Competitivo' : '🏌️ Partida Grupal'}
                </span>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  Sala de Espera
                </h2>
              </div>
            </div>

            {/* Room Code Badge */}
            <div className="flex items-center gap-2 bg-[#1b140f] px-3.5 py-2 rounded-2xl border border-[#4d3d31]">
              <span className="text-xs font-black uppercase text-stone-400">Código:</span>
              <span className="font-mono font-black text-amber-400 text-base tracking-wider">
                {currentRoom.roomCode}
              </span>
              <button
                onClick={handleCopyRoomCode}
                className="p-1.5 bg-[#3d312a] hover:bg-[#4d3e35] text-stone-200 rounded-lg transition-colors cursor-pointer"
                title="Copiar código para invitar amigos"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Match Status & Countdown Banner */}
          {matchCountdown !== null ? (
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-black p-4 rounded-2xl text-center shadow-lg animate-bounce">
              <span className="text-xs font-black uppercase tracking-widest block">¡{t('mp_quickDuel', language)}!</span>
              <span className="text-3xl font-black">{t('levels_title', language)} in {matchCountdown}...</span>
            </div>
          ) : (
            <div className="bg-[#2a2019] border border-[#4d3d31] p-3 rounded-2xl flex items-center justify-between text-xs text-stone-300 px-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t('mp_waitingOpponents', language)} ({playersList.length}/{currentRoom.mode === 'ranked_1v1' ? 2 : 4})</span>
              </div>
              <span className="text-amber-400 font-bold">{currentRoom.holeCount} {t('holes', language)}</span>
            </div>
          )}

          {/* Players Grid with Rank Logos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {playersList.map((player) => {
              const pRank = getRankFromRP(player.rp);
              const locRank = getLocalizedRankTier(pRank, language);
              const isMe = player.uid === currentUser.uid;

              return (
                <div
                  key={player.uid}
                  className={`p-4 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isMe
                      ? 'bg-[#352820] border-amber-500/80 shadow-lg'
                      : 'bg-[#261d17] border-[#4d3d31]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <RankLogo tier={pRank.tier} size={54} showGlow={pRank.tier >= 5} />
                        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 rounded-full border border-black">
                          T{pRank.tier}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-sm text-white truncate max-w-[150px]">
                            {player.displayName}
                          </h4>
                          {isMe && (
                            <span className="text-[9px] font-black uppercase bg-emerald-500 text-black px-1.5 rounded">
                              {t('mp_you', language)}
                            </span>
                          )}
                          {player.isBot && (
                            <span className="text-[9px] font-black uppercase bg-blue-500 text-white px-1.5 rounded">
                              BOT AI
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-xs font-black uppercase"
                            style={{ color: pRank.textColor }}
                          >
                            {locRank.name}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            • {player.rp} RP
                          </span>
                        </div>

                        <span className="text-[10px] text-stone-400 block truncate mt-0.5">
                          {locRank.logoDescription}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {t('mp_ready', language)}
                    </span>
                  </div>

                  {/* Equipped Gear Badges */}
                  <div className="mt-3 pt-2.5 border-t border-[#4d3d31] flex items-center justify-between text-[11px] text-stone-400">
                    <span>{t('ball', language)}: <strong className="text-stone-200 uppercase font-mono">{player.ballSkin}</strong></span>
                    <span>{t('trail', language)}: <strong className="text-stone-200 uppercase font-mono">{player.trailSkin}</strong></span>
                  </div>
                </div>
              );
            })}

            {/* Empty Slot Card */}
            {playersList.length < (currentRoom.mode === 'ranked_1v1' ? 2 : 4) && (
              <div className="p-6 rounded-3xl border-2 border-dashed border-[#4d3d31] bg-[#1d1612]/60 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                <Radio className="w-6 h-6 text-stone-500 animate-pulse" />
                <span className="text-xs font-bold text-stone-400">{t('mp_searchingOpponent', language)}</span>
                <span className="text-[10px] text-stone-500">{t('mp_shareCodePrompt', language)}: <strong>{currentRoom.roomCode}</strong></span>
              </div>
            )}
          </div>

          {/* Host Controls */}
          <div className="bg-[#2c221b] border border-[#4d3d31] p-4 rounded-3xl space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {playersList.length >= 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    startMatch(currentRoom.id);
                    onStartMatch(currentRoom);
                  }}
                  className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>{t('mp_startMatchNow', language)} ({playersList.length} Players)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAddBot}
                    className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{t('mp_playVsBot', language)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyRoomCode}
                    className="w-full sm:w-auto bg-[#3d312a] hover:bg-[#4d3e35] text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('mp_inviteWithCode', language)}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN ONLINE HUB (Matchmaking / Create / Join)
  return (
    <div className="w-full h-full bg-[#1b140f] text-[#faf6ee] flex flex-col justify-between p-4 sm:p-6 font-sans overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto space-y-5 my-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-[#2a1f18] p-4 sm:p-5 rounded-3xl border-2 border-[#423429] shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMenu}
              className="p-2.5 bg-[#382b22] hover:bg-[#48372c] text-stone-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {t('tab_multiplayer', language)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {t('mp_title', language)}
              </h2>
            </div>
          </div>

          {/* Player Rank Header Badge */}
          <div 
            onClick={onOpenRanksModal}
            className="flex items-center gap-3 bg-[#1e1510] hover:bg-[#281c15] p-2.5 sm:px-4 rounded-2xl border border-amber-500/40 cursor-pointer transition-all active:scale-98 shadow-md"
            title="Ver los 7 Rangos y Emblemas"
          >
            <RankLogo tier={playerRank.tier} size={42} showGlow />
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-amber-300 block">
                {getLocalizedRankTier(playerRank, language).name} ({t('tab_ranks', language)} {playerRank.tier})
              </span>
              <span className="text-xs font-mono font-black text-white">
                {playerRP.toLocaleString()} RP
              </span>
            </div>
            <Award className="w-4 h-4 text-amber-400 ml-1" />
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-900/40 border border-red-500 text-red-200 rounded-2xl text-xs font-bold text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-[#251b14] p-1.5 rounded-2xl border border-[#3d2e24]">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quick'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#32241b]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>{t('mp_quickDuel', language)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#32241b]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{t('mp_createRoom', language)}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#32241b]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{t('mp_joinWithCode', language)}</span>
          </button>
        </div>

        {/* TAB 1: QUICK MATCH / MATCHMAKING */}
        {activeTab === 'quick' && (
          <div className="bg-[#281e17] border-2 border-[#423429] p-6 sm:p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in">
            {isSearching ? (
              <div className="space-y-5 py-4">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-amber-400/60 animate-spin"></div>
                  <Swords className="w-10 h-10 text-amber-400 relative z-10" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">{t('mp_searchingOpponent', language)}</h3>
                  <p className="text-xs text-stone-400 mt-1">
                    {getLocalizedRankTier(playerRank, language).name} • <strong className="text-amber-400 font-mono">{searchTimer}s</strong>
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentRoom) {
                        handleAddBot();
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{t('mp_playVsBot', language)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSearching(false)}
                    className="bg-[#382b22] hover:bg-[#48372c] text-stone-300 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                  >
                    {t('cancel', language)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-3xl mx-auto flex items-center justify-center border border-amber-500/30">
                    <Swords className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{t('mp_quickDuel', language)}</h3>
                  <p className="text-xs text-stone-300">
                    {t('mp_subtitle', language)}
                  </p>
                </div>

                {/* Ranked Rules Pill */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left max-w-xl mx-auto text-xs">
                  <div className="bg-[#1c140f] p-3 rounded-2xl border border-[#3d2e24]">
                    <span className="text-[10px] font-black uppercase text-amber-400 block">{t('mp_victory', language)}</span>
                    <span className="font-bold text-stone-200">+45 RP</span>
                  </div>
                  <div className="bg-[#1c140f] p-3 rounded-2xl border border-[#3d2e24]">
                    <span className="text-[10px] font-black uppercase text-red-400 block">{t('mp_defeat', language)}</span>
                    <span className="font-bold text-stone-200">-20 RP</span>
                  </div>
                  <div className="bg-[#1c140f] p-3 rounded-2xl border border-[#3d2e24]">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block">{t('levels_title', language)}</span>
                    <span className="font-bold text-stone-200">3 {t('holes', language)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickMatch}
                  className="w-full max-w-md mx-auto bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 transition-all active:scale-98 cursor-pointer"
                >
                  <Swords className="w-5 h-5" />
                  <span>{t('mp_searchRanked', language)}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE CUSTOM ROOM */}
        {activeTab === 'create' && (
          <div className="bg-[#281e17] border-2 border-[#423429] p-6 sm:p-7 rounded-3xl shadow-xl space-y-5 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-white">{t('mp_setupRoom', language)}</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {t('mp_shareCodePrompt', language)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mode Select */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-stone-400 block">
                  {t('tab_multiplayer', language)}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setModeChoice('ranked_1v1')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      modeChoice === 'ranked_1v1'
                        ? 'bg-amber-500 text-black border-amber-600 font-black shadow-sm'
                        : 'bg-[#1c140f] border-[#3d2e24] text-stone-300 hover:bg-[#261c15]'
                    }`}
                  >
                    1v1 (2 Players)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeChoice('casual_4p')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      modeChoice === 'casual_4p'
                        ? 'bg-amber-500 text-black border-amber-600 font-black shadow-sm'
                        : 'bg-[#1c140f] border-[#3d2e24] text-stone-300 hover:bg-[#261c15]'
                    }`}
                  >
                    Party (4 Players)
                  </button>
                </div>
              </div>

              {/* Hole Count Select */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-stone-400 block">
                  {t('holes', language)}
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {[3, 6, 9].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setHoleCountChoice(count)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        holeCountChoice === count
                          ? 'bg-amber-500 text-black border-amber-600 font-black shadow-sm'
                          : 'bg-[#1c140f] border-[#3d2e24] text-stone-300 hover:bg-[#261c15]'
                      }`}
                    >
                      {count} {t('holes', language)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('mp_createRoomBtn', language)}</span>
            </button>
          </div>
        )}

        {/* TAB 3: JOIN WITH CODE */}
        {activeTab === 'join' && (
          <div className="bg-[#281e17] border-2 border-[#423429] p-6 sm:p-7 rounded-3xl shadow-xl space-y-5 animate-in fade-in max-w-md mx-auto text-center">
            <div>
              <h3 className="text-lg font-black text-white">{t('mp_joinExisting', language)}</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {t('mp_enterCodePrompt', language)}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="EJ: GOLF-4921"
                maxLength={10}
                className="w-full bg-[#1c140f] border-2 border-[#423429] focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center font-mono font-black text-lg text-amber-400 uppercase tracking-widest outline-none transition-all"
              />

              <button
                type="button"
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-black py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('mp_enterRoom', language)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Ranks Banner Callout */}
        <div 
          onClick={onOpenRanksModal}
          className="bg-gradient-to-r from-[#2f1f14] via-[#3d291b] to-[#2f1f14] border border-[#523927] p-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer hover:border-amber-500/50 transition-all shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex -space-x-3">
              <RankLogo tier={1} size={34} />
              <RankLogo tier={4} size={34} />
              <RankLogo tier={7} size={34} showGlow />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-white">
                {t('ranks_guideTitle', language)}
              </h4>
              <p className="text-[11px] text-stone-300 font-medium">
                {t('ranks_guideDesc', language)}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="bg-[#4a3424] text-amber-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-colors cursor-pointer"
          >
            {t('tab_ranks', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
