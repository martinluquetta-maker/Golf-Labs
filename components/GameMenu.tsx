/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LevelData } from '../types';
import { LEVELS } from '../levels';
import { COLORS } from '../constants';
import { Play, HelpCircle, Settings, Award, ChevronRight, Volume2, Bot, Sparkles, Sliders, ShoppingBag, Coins, User, LogIn, LogOut, Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
import { BallStoreView } from './BallStoreView';

interface GameMenuProps {
  onStartGame: (levelIndex: number) => void;
  bestScores: Record<number, number>;
  aiCaddyEnabled: boolean;
  onToggleAiCaddy: () => void;
  currentLevelIndex: number;
  coins: number;
  unlockedBallIds: string[];
  equippedBallId: string;
  onBuyBall: (id: string, price: number) => void;
  onEquipBall: (id: string) => void;
  user: any;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  firebaseConfigured: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'pending';
}

export const GameMenu: React.FC<GameMenuProps> = ({
  onStartGame,
  bestScores,
  aiCaddyEnabled,
  onToggleAiCaddy,
  currentLevelIndex,
  coins,
  unlockedBallIds,
  equippedBallId,
  onBuyBall,
  onEquipBall,
  user,
  onLogin,
  onLogout,
  firebaseConfigured,
  syncStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'levels' | 'store' | 'how-to' | 'settings'>('play');
  const [levelGroup, setLevelGroup] = useState<0 | 1 | 2>(0); // 0: 1-20, 1: 21-40, 2: 41-60

  const getGroupLevels = () => {
    const start = levelGroup * 20;
    return LEVELS.slice(start, start + 20);
  };

  const getScoreTerm = (strokes: number, par: number) => {
    if (strokes === 1) return "Hole-in-One";
    const diff = strokes - par;
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    return `${strokes} strokes`;
  };

  // Keep stats for the dashboard
  const playedCount = Object.keys(bestScores).length;
  const totalStrokes = Object.values(bestScores).reduce((a, b) => a + b, 0);
  const totalParPlayed = Object.keys(bestScores).reduce((acc, key) => {
    const idx = parseInt(key, 10);
    return acc + (LEVELS[idx]?.par || 0);
  }, 0);
  const totalDiff = totalStrokes - totalParPlayed;

  return (
    <div className="fixed inset-0 bg-[#3d312a]/95 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto select-none pointer-events-auto">
      <div 
        className="relative bg-[#faf6ee] text-[#3d312a] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-[620px] max-h-[95vh] border border-[#3d312a]/15 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Left Sidebar Menu Options */}
        <div className="w-full md:w-64 bg-[#efe6d4] border-b md:border-b-0 md:border-r border-[#3d312a]/10 flex flex-col justify-between p-6">
          <div className="flex flex-col gap-6">
            {/* Title / Brand */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#db5641]/10 text-[#db5641] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> 60-Hole Championship
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#3d312a] leading-none">
                GOLF <span className="text-[#db5641]">LAB</span>
              </h1>
              <p className="text-xs text-[#7a7065] font-semibold mt-1 uppercase tracking-wider">
                Physics Puzzle Sandbox
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('play')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'play'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>Play Lab</span>
              </button>

              <button
                onClick={() => setActiveTab('levels')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'levels'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Hole Directory</span>
                {playedCount > 0 && (
                  <span className="ml-auto bg-[#db5641] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {playedCount}/60
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('store')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'store'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Ball Store</span>
                <span className="ml-auto bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-sm">
                  🪙
                </span>
              </button>

              <button
                onClick={() => setActiveTab('how-to')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'how-to'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>How to Play</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Caddy & HUD</span>
              </button>
            </div>
          </div>

          {/* Quick stats on left footer */}
          {playedCount > 0 && (
            <div className="hidden md:flex flex-col gap-2 p-4 bg-[#faf6ee]/60 rounded-2xl border border-[#3d312a]/5 text-xs">
              <div className="flex justify-between items-center text-[#7a7065] font-semibold">
                <span>Completed:</span>
                <span className="text-[#3d312a] font-bold">{playedCount} / 60</span>
              </div>
              <div className="flex justify-between items-center text-[#7a7065] font-semibold">
                <span>Total Score:</span>
                <span className={`font-bold ${totalDiff <= 0 ? 'text-[#6ca750]' : 'text-[#db5641]'}`}>
                  {totalDiff === 0 ? 'Even Par' : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`}
                </span>
              </div>
            </div>
          )}

          {/* Google Sync Account Module */}
          <div className="flex flex-col gap-2 p-4 bg-[#faf6ee]/60 border border-[#3d312a]/10 rounded-2xl text-xs mt-auto">
            {!firebaseConfigured ? (
              <div className="space-y-1.5 text-center py-0.5">
                <div className="flex items-center justify-center gap-1 font-bold text-[#db5641]">
                  <CloudOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Cloud Save Offline</span>
                </div>
                <p className="text-[10px] text-[#7a7065] font-semibold leading-normal">
                  To enable Google Cloud Saves, complete the companion <b className="text-[#db5641]">"Set up Firebase"</b> step in your AI Studio dashboard panel.
                </p>
              </div>
            ) : !user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-extrabold text-[#3d312a]">
                  <Cloud className="w-4 h-4 shrink-0 text-[#db5641]" />
                  <span>Sync Google Account</span>
                </div>
                <p className="text-[10px] text-[#7a7065] font-semibold leading-normal">
                  Backup your 60-hole progress and gold coins in real-time.
                </p>
                {typeof window !== 'undefined' && window.self !== window.top ? (
                  <div className="space-y-1.5 border border-[#db5641]/20 bg-[#db5641]/5 p-2 rounded-xl mt-1">
                    <p className="text-[9px] text-[#db5641] font-bold leading-normal">
                      ⚠️ Playing in the preview panel? Browser policies block Google sign-in inside iframes.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full bg-[#6ca750] hover:bg-[#5b9042] text-white py-1.5 px-2.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all active:scale-95 text-[10px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Open in New Tab & Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLogin}
                      className="w-full text-center text-[9px] text-[#7a7065] hover:text-[#3d312a] font-semibold underline block pt-0.5"
                    >
                      Try signing in here anyway
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[11px]"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-[#3d312a]/10"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#db5641] text-white flex items-center justify-center font-bold text-[11px]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#3d312a] truncate text-[11px]">
                      {user.displayName || 'Google Champion'}
                    </p>
                    <p className="text-[9px] text-[#7a7065] truncate font-semibold leading-none mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#3d312a]/10 pt-1.5 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 font-bold text-[#6ca750]">
                    {syncStatus === 'syncing' ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-[#db5641]" />
                        <span className="text-[#db5641]">Syncing...</span>
                      </>
                    ) : syncStatus === 'offline' ? (
                      <>
                        <CloudOff className="w-3 h-3 text-[#7a7065]" />
                        <span className="text-[#7a7065]">Offline</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3 text-[#6ca750]" />
                        <span>Cloud Synced</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-[#db5641] hover:text-[#c24a37] font-bold flex items-center gap-0.5 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Panel Content View */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8">
          {/* TAB 1: PLAY DASHBOARD */}
          {activeTab === 'play' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-black text-[#3d312a] flex items-center gap-2 mb-2 leading-none">
                  🏌️‍♂️ GOLF LAB ORATORY
                </h2>
                <p className="text-[#7a7065] text-sm font-medium leading-relaxed mb-6">
                  Ready to line up your golf shots? Hit the course featuring boosters, sand traps, rushing waters, teleportation portals, and AI assistance!
                </p>

                {playedCount === 0 ? (
                  <div className="bg-[#efe6d4]/40 border border-[#3d312a]/10 rounded-2xl p-5 mb-6 flex items-start gap-4">
                    <span className="text-3xl">⛳</span>
                    <div>
                      <h4 className="font-extrabold text-[#3d312a] text-sm">Course Challenge Guidelines</h4>
                      <p className="text-xs text-[#7a7065] font-medium leading-relaxed mt-1">
                        Use slingshot drag-and-release mechanics OR click the modern <strong>Touch Assist</strong> control panel in-game to navigate traps, slopes, and portals safely. Get insights on complex angles directly from your real-time AI caddying guide!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#6ca750]/10 border border-[#6ca750]/20 rounded-2xl p-4 text-center">
                      <span className="text-2xl font-black text-[#6ca750] block">{playedCount} / 60</span>
                      <span className="text-[10px] text-[#7a7065] font-bold uppercase tracking-wider">Holes Masters Completed</span>
                    </div>
                    <div className="bg-[#db5641]/10 border border-[#db5641]/20 rounded-2xl p-4 text-center">
                      <span className="text-2xl font-black text-[#db5641] block">
                        {totalDiff === 0 ? 'Par' : totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                      </span>
                      <span className="text-[10px] text-[#7a7065] font-bold uppercase tracking-wider">Accumulated Score</span>
                    </div>
                  </div>
                )}

                {/* Return Point Indicator */}
                <div className="bg-[#efe6d4]/50 border border-[#efe6d4] rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 text-lg rounded-xl bg-[#db5641] text-white flex items-center justify-center font-black">
                      {currentLevelIndex + 1}
                    </span>
                    <div>
                      <span className="text-[10px] text-[#7a7065] font-extrabold uppercase block tracking-wider">Current Hole Selection</span>
                      <span className="font-extrabold text-[#3d312a] text-sm">{LEVELS[currentLevelIndex]?.name || `Level ${currentLevelIndex + 1}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7a7065] font-bold bg-[#faf6ee] px-2.5 py-1 rounded-full border border-[#3d312a]/10">
                    Par {LEVELS[currentLevelIndex]?.par}
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onStartGame(currentLevelIndex)}
                  className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-4 px-6 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>TEE OFF NOW (HOLE {currentLevelIndex + 1})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HOLE DIRECTORY SELECTOR */}
          {activeTab === 'levels' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="flex-1 overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-[#3d312a]">Hole Directory</h2>
                  
                  {/* Rows level tabs groups */}
                  <div className="flex bg-[#efe6d4] p-0.5 rounded-xl text-xs font-bold border border-[#3d312a]/5">
                    <button
                      onClick={() => setLevelGroup(0)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        levelGroup === 0 ? 'bg-[#faf6ee] text-[#db5641] shadow-sm' : 'text-[#7a7065]'
                      }`}
                    >
                      Holes 1-20
                    </button>
                    <button
                      onClick={() => setLevelGroup(1)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        levelGroup === 1 ? 'bg-[#faf6ee] text-[#db5641] shadow-sm' : 'text-[#7a7065]'
                      }`}
                    >
                      Holes 21-40
                    </button>
                    <button
                      onClick={() => setLevelGroup(2)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        levelGroup === 2 ? 'bg-[#faf6ee] text-[#db5641] shadow-sm' : 'text-[#7a7065]'
                      }`}
                    >
                      Holes 41-60
                    </button>
                  </div>
                </div>

                {/* Scrollable scroll panel grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 h-[340px] overflow-y-auto pr-1">
                  {getGroupLevels().map((lvl) => {
                    const idx = lvl.id - 1;
                    const isCompleted = bestScores[idx] !== undefined;
                    const best = bestScores[idx];
                    const isSelected = idx === currentLevelIndex;

                    return (
                      <button
                        key={lvl.id}
                        onClick={() => onStartGame(idx)}
                        className={`group relative p-3 rounded-2xl text-left border flex flex-col justify-between transition-all aspect-square min-h-[90px] select-none ${
                          isSelected
                            ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] scale-98 shadow-md'
                            : isCompleted
                            ? 'bg-[#6ca750]/5 hover:bg-[#6ca750]/10 border-[#6ca750]/30 text-[#3d312a]'
                            : 'bg-[#faf6ee] hover:bg-[#efe6d4]/40 border-[#3d312a]/10 text-[#3d312a]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/15 text-[#faf6ee]' : 'bg-[#3d312a]/5 text-[#7a7065]'
                          }`}>
                            Hole {lvl.id}
                          </span>
                          
                          {/* Colored category pill */}
                          <div 
                            className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                            style={{ backgroundColor: lvl.color }}
                          />
                        </div>

                        <div className="mt-2 flex-1 flex flex-col justify-end">
                          <h4 className="font-extrabold text-[12px] leading-tight line-clamp-1 group-hover:text-[#db5641] transition-colors">
                            {lvl.name}
                          </h4>
                          
                          <div className="flex items-center justify-between mt-1 text-[10px] font-bold">
                            <span className="opacity-70">Par {lvl.par}</span>
                            {isCompleted ? (
                              <span className="text-[#6ca750] font-black">
                                {best === 1 ? 'HIO!' : getScoreTerm(best, lvl.par)}
                              </span>
                            ) : (
                              <span className="opacity-40">Play</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 text-center">
                <p className="text-xs text-[#7a7065] font-semibold flex items-center justify-center gap-1">
                  💡 Select any cell box to instantly jump to that hole design!
                </p>
              </div>
            </div>
          )}

          {/* TAB: BALL STORE */}
          {activeTab === 'store' && (
            <BallStoreView
              coins={coins}
              unlockedBallIds={unlockedBallIds}
              equippedBallId={equippedBallId}
              onBuyBall={onBuyBall}
              onEquipBall={onEquipBall}
            />
          )}

          {/* TAB 3: HOW TO PLAY */}
          {activeTab === 'how-to' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="h-[400px] overflow-y-auto pr-1">
                <h2 className="text-xl font-black text-[#3d312a] mb-4 flex items-center gap-2">
                  <span>💡</span> Manual Guide: How to Play
                </h2>

                <div className="space-y-4 text-sm font-medium text-[#7a7065] leading-relaxed">
                  <div className="bg-[#faf6ee] border border-[#3d312a]/10 rounded-2xl p-4 shadow-sm">
                    <h3 className="font-extrabold text-[#3d312a] text-sm flex items-center gap-1.5 mb-1">
                      <Sliders className="w-4 h-4 text-[#db5641]" /> Slingshot Aim & Launch
                    </h3>
                    <p className="text-xs">
                      Double key mechanics standard to Golf! <strong>Click or press onto the ball or canvas</strong>, drag backwards like an elastic slingshot to adjust angle and energy, and release to put the ball in motion.
                    </p>
                  </div>

                  <div className="bg-[#faf6ee] border border-[#3d312a]/10 rounded-2xl p-4 shadow-sm">
                    <h3 className="font-extrabold text-[#3d312a] text-sm flex items-center gap-1.5 mb-1">
                      <span>🎮</span> Touch Assist Controls (Optimized for Mobile)
                    </h3>
                    <p className="text-xs">
                      Struggling to aim precisely on screen? Click the <strong>Touch Assist button</strong>. Use the wheel dial below the course to dial in angles perfectly, adjust power with a fluid slider, and press the prominent red <strong>PUTT!</strong> button.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="border border-[#3d312a]/10 rounded-2xl p-3 bg-white/60">
                      <h4 className="font-bold text-xs text-[#3d312a] mb-1.5">Interactive Board Mechanics</h4>
                      <div className="space-y-1.5 text-[11px] font-semibold text-[#7a7065]">
                        <div className="flex justify-between">
                          <span>🔵 Boost Rails (<code className="text-[#db5641] font-mono">&gt; &lt; ^ v</code>):</span>
                          <span className="text-[#3d312a]">Speeds up the ball</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🟢 Bouncy Pads (<code className="text-[#db5641] font-mono">B</code>):</span>
                          <span className="text-[#3d312a]">Trampoline bounce effect</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🌀 Portals (<code className="text-[#db5641] font-mono">1 2 3</code>):</span>
                          <span className="text-[#3d312a]">Wormhole teleport pair</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#3d312a]/10 rounded-2xl p-3 bg-white/60">
                      <h4 className="font-bold text-xs text-[#3d312a] mb-1.5">Hazards & Trex Danger</h4>
                      <div className="space-y-1.5 text-[11px] font-semibold text-[#7a7065]">
                        <div className="flex justify-between">
                          <span>🌊 Rushing Water (<code className="text-[#db5641] font-mono">W</code>):</span>
                          <span className="text-[#3d312a]">Drowns ball to reset</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⏳ Sand Traps (<code className="text-[#db5641] font-mono">Z</code>):</span>
                          <span className="text-[#3d312a]">Extraneous friction trap</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🦖 Trex Mobiles (<code className="text-[#db5641] font-mono">T</code>):</span>
                          <span className="text-[#3d312a]">Guards that swipe the ball</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setActiveTab('play')}
                  className="w-full bg-[#3d312a] hover:bg-[#3d312a]/90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all text-xs"
                >
                  <span>Return to Menu</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & PREFERENCES */}
          {activeTab === 'settings' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#3d312a] mb-2 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#db5641]" /> Interface Preferences
                </h2>

                <div className="space-y-4">
                  {/* AI Caddy Toggle Option */}
                  <div className="bg-[#faf6ee] p-4 rounded-2xl border border-[#3d312a]/10 flex items-center justify-between gap-4">
                    <div className="flex gap-3 items-start">
                      <div className="h-10 w-10 shrink-0 bg-[#db5641]/10 rounded-xl text-[#db5641] flex items-center justify-center font-bold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#3d312a] text-sm">Real-time AI Caddy Insights</h4>
                        <p className="text-xs text-[#7a7065] mt-0.5 leading-relaxed font-semibold">
                          Allows your customized caddy assistant to guide your course lines, commentate, and celebrate points.
                        </p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={onToggleAiCaddy}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          aiCaddyEnabled ? 'bg-[#db5641]' : 'bg-[#3d312a]/25'
                        }`}
                        role="switch"
                        aria-checked={aiCaddyEnabled}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            aiCaddyEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Level select accessibility info */}
                  <div className="bg-[#efe6d4]/40 border border-[#3d312a]/5 p-4 rounded-2xl">
                    <h5 className="text-[#3d312a] font-extrabold text-xs mb-1.5">Accessibility Tip</h5>
                    <p className="text-[11px] text-[#7a7065] font-semibold leading-relaxed">
                      You can navigate directly dynamically to any level inside GOLF LAB by clicking "Hole Directory" tab and selecting any of the 60 grid slots. No password or dev tools needed! Touch Assist panel toggles freely at any point on screen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onStartGame(currentLevelIndex)}
                  className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-4 px-6 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START TEEING OFF (HOLE {currentLevelIndex + 1})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
