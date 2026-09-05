/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LevelData } from '../types';
import { LEVELS, CYBER_LEVELS } from '../levels';
import { COLORS } from '../constants';
import { Play, HelpCircle, Settings, Award, ChevronRight, Volume2, Bot, Sparkles, Sliders, ShoppingBag, Coins, User, LogIn, LogOut, Cloud, CloudOff, RefreshCw, AlertCircle, Copy, Check, Trophy, Star, Lock, Crown, Terminal, Mail, Key, Eye, EyeOff, UserPlus, X, ShieldCheck, CheckCircle2, Swords, Flame, ArrowLeft } from 'lucide-react';
import { BallStoreView } from './BallStoreView';
import { LeaderboardView } from './LeaderboardView';
import { AchievementsView } from './AchievementsView';
import { ConsoleView } from './ConsoleView';
import { OnlineMultiplayerView } from './OnlineMultiplayerView';
import { RankLogo, RankBadge } from './RankBadges';
import { getRankFromRP, getRankProgress, RANK_TIERS, getLocalizedRankTier } from './RankData';
import { RanksModal } from './RanksModal';
import { MultiplayerRoom } from '../services/multiplayerService';
import { Language, SUPPORTED_LANGUAGES, t, saveLanguage } from '../utils/translations';
import { Globe } from 'lucide-react';
import { SecretSoundModal } from './SecretSoundModal';

interface GameMenuProps {
  onStartGame: (levelIndex: number) => void;
  bestScores: Record<number, number>;
  aiCaddyEnabled: boolean;
  onToggleAiCaddy: () => void;
  currentLevelIndex: number;
  coins: number;
  unlockedBallIds: string[];
  equippedBallId: string;
  unlockedTrailIds?: string[];
  equippedTrailId?: string;
  onBuyBall: (id: string, price: number) => void;
  onEquipBall: (id: string) => void;
  onBuyTrail?: (id: string, price: number) => void;
  onEquipTrail?: (id: string) => void;
  onAddCoins?: (amount: number) => void;
  onUnlockItems?: (ballIds: string[], trailIds: string[]) => void;
  user: any;
  onLogin: () => Promise<void>;
  onLoginEmail?: (email: string, pass: string) => Promise<void>;
  onRegisterEmail?: (email: string, pass: string, name?: string) => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
  onLogout: () => Promise<void>;
  firebaseConfigured: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'pending';
  authError: { code: string; message: string; domain?: string } | null;
  onClearAuthError: () => void;
  currentWorld?: 'classic' | 'cyber';
  onSelectWorld?: (world: 'classic' | 'cyber') => void;
  isCyberUnlocked?: boolean;
  onUnlockAllLevels?: () => void;
  onSetAllScoresHIO?: () => void;
  onOpenMultiplayer?: () => void;
  onOpenRanks?: () => void;
  onStartMultiplayerMatch?: (room: MultiplayerRoom) => void;
  playerRP?: number;
  rankedWins?: number;
  rankedMatches?: number;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
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
  unlockedTrailIds = ['trail_dust_white'],
  equippedTrailId = 'trail_dust_white',
  onBuyBall,
  onEquipBall,
  onBuyTrail = () => {},
  onEquipTrail = () => {},
  onAddCoins = () => {},
  onUnlockItems = () => {},
  user,
  onLogin,
  onLoginEmail,
  onRegisterEmail,
  onResetPassword,
  onLogout,
  firebaseConfigured,
  syncStatus,
  authError,
  onClearAuthError,
  currentWorld = 'classic',
  onSelectWorld = () => {},
  isCyberUnlocked = false,
  onUnlockAllLevels,
  onSetAllScoresHIO,
  onOpenMultiplayer = () => {},
  onOpenRanks = () => {},
  onStartMultiplayerMatch = () => {},
  playerRP = 0,
  rankedWins = 0,
  rankedMatches = 0,
  language = 'es',
  onLanguageChange = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'play' | 'levels' | 'multiplayer' | 'ranks' | 'store' | 'leaderboard' | 'achievements' | 'how-to' | 'settings' | 'console'>('play');
  const [levelGroup, setLevelGroup] = useState<0 | 1 | 2>(0); // 0: 1-20, 1: 21-40, 2: 41-60
  const [copied, setCopied] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [showSecretSoundModal, setShowSecretSoundModal] = useState(false);

  const currentRank = getRankFromRP(playerRP);
  const rankProg = getRankProgress(playerRP);

  // Email & Google Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authFormError, setAuthFormError] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Exclusive Creator Check for Martin Luquetta
  const isMartin = Boolean(
    (user?.email && user.email.toLowerCase().trim() === 'martin.luquetta@sgs.edu.co') ||
    (user?.email && user.email.toLowerCase().includes('martin.luquetta')) ||
    (user?.displayName && user.displayName.toLowerCase().trim() === 'martin') ||
    (typeof window !== 'undefined' && localStorage.getItem('is_martin_creator') === 'true')
  );

  useEffect(() => {
    if (currentWorld === 'cyber') {
      setLevelGroup(0);
    }
  }, [currentWorld]);

  const activeLevels = currentWorld === 'cyber' ? CYBER_LEVELS : LEVELS;

  const handleCopyDomain = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFormError(null);
    setResetSuccessMsg(null);

    const cleanEmail = authEmail.trim();
    if (!cleanEmail) {
      setAuthFormError("Please enter your email address.");
      return;
    }

    if (authMode === 'reset') {
      if (onResetPassword) {
        setAuthLoading(true);
        try {
          await onResetPassword(cleanEmail);
          setResetSuccessMsg(`Password reset instructions sent to ${cleanEmail}! Please check your inbox.`);
        } catch (err: any) {
          setAuthFormError(err?.message || "Failed to send reset email.");
        } finally {
          setAuthLoading(false);
        }
      }
      return;
    }

    if (!authPassword) {
      setAuthFormError("Please enter your password.");
      return;
    }

    if (authMode === 'signup' && authPassword.length < 6) {
      setAuthFormError("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        if (onRegisterEmail) {
          await onRegisterEmail(cleanEmail, authPassword, authDisplayName.trim());
        }
      } else {
        if (onLoginEmail) {
          await onLoginEmail(cleanEmail, authPassword);
        }
      }
      setShowAuthModal(false);
      setAuthPassword('');
      setAuthEmail('');
      setAuthDisplayName('');
    } catch (err: any) {
      setAuthFormError(err?.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setAuthFormError(null);
    setResetSuccessMsg(null);
    setAuthLoading(true);
    try {
      await onLogin();
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthFormError(err?.message || "Google Sign-In failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const getGroupLevels = () => {
    const start = levelGroup * 20;
    return activeLevels.slice(start, start + 20);
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

  const getLevelBestScore = (levelIndex: number) => {
    const key = currentWorld === 'cyber' ? 100 + levelIndex : levelIndex;
    return bestScores[key];
  };

  // Keep stats for the dashboard
  const playedCount = activeLevels.filter((_, idx) => getLevelBestScore(idx) !== undefined).length;
  const totalStrokes = activeLevels.reduce((acc, _, idx) => {
    const score = getLevelBestScore(idx);
    return acc + (score || 0);
  }, 0);
  const totalParPlayed = activeLevels.reduce((acc, lvl, idx) => {
    const score = getLevelBestScore(idx);
    return acc + (score !== undefined ? lvl.par : 0);
  }, 0);
  const totalDiff = totalStrokes - totalParPlayed;

  return (
    <div className="fixed inset-0 bg-[#3d312a]/95 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto select-none pointer-events-auto">
      <div 
        className="relative bg-[#faf6ee] text-[#3d312a] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-[620px] max-h-[95vh] border border-[#3d312a]/15 animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Left Sidebar Menu Options */}
        <div className="w-full md:w-64 bg-[#efe6d4] border-b md:border-b-0 md:border-r border-[#3d312a]/10 flex flex-col justify-between p-6 overflow-y-auto">
          <div className="flex flex-col gap-6">
            {/* Title / Brand */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#db5641]/10 text-[#db5641] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> {currentWorld === 'cyber' ? '20-Hole Cyber World' : '60-Hole Championship'}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#3d312a] leading-none">
                GOLF <span className="text-[#db5641]">LAB</span>
              </h1>
              <p className="text-xs text-[#7a7065] font-semibold mt-1 uppercase tracking-wider">
                {currentWorld === 'cyber' ? 'Cyber Sandbox Mode' : 'Physics Puzzle Sandbox'}
              </p>
            </div>

            {/* Realm / World Selector */}
            <div className="flex flex-col gap-1.5 bg-[#db5641]/5 p-2 rounded-2xl border border-[#db5641]/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a7065] px-1">Selected Realm:</span>
              <div className="flex bg-[#efe6d4] p-0.5 rounded-xl text-xs font-bold border border-[#3d312a]/5">
                <button
                  onClick={() => onSelectWorld('classic')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all font-bold ${
                    currentWorld === 'classic' ? 'bg-[#faf6ee] text-[#db5641] shadow-sm' : 'text-[#7a7065]'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => {
                    if (isCyberUnlocked) {
                      onSelectWorld('cyber');
                    }
                  }}
                  disabled={!isCyberUnlocked}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all font-bold flex items-center justify-center gap-1 relative ${
                    !isCyberUnlocked 
                      ? 'opacity-60 cursor-not-allowed text-[#7a7065]' 
                      : currentWorld === 'cyber' 
                      ? 'bg-[#121824] text-[#00f0ff] shadow-sm' 
                      : 'text-[#7a7065]'
                  }`}
                >
                  {isCyberUnlocked ? (
                    <>
                      <Bot className="w-3.5 h-3.5 text-[#00f0ff]" /> Cyber
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#7a7065]" /> Cyber
                    </>
                  )}
                </button>
              </div>
              {!isCyberUnlocked && (
                <span className="text-[9px] text-[#db5641] font-bold uppercase text-center tracking-wider mt-0.5">
                  🔒 UNLOCKS AT HOLE 20
                </span>
              )}
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
                <span>{t('tab_play', language)}</span>
              </button>

              <button
                onClick={() => setActiveTab('multiplayer')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 border border-amber-500/30 ${
                  activeTab === 'multiplayer'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md ring-2 ring-amber-400/40'
                    : 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20'
                }`}
              >
                <Swords className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('tab_multiplayer', language)}</span>
                <span className="ml-auto bg-amber-900 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  LIVE
                </span>
              </button>

              <button
                onClick={() => setActiveTab('ranks')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'ranks'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <div className="shrink-0 scale-90 -ml-1">
                  <RankLogo tier={currentRank.tier} size={20} />
                </div>
                <span>{t('tab_ranks', language)}</span>
                <span className="ml-auto text-[10px] font-mono font-black text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                  {playerRP} RP
                </span>
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
                <span>{t('tab_levels', language)}</span>
                {playedCount > 0 && (
                  <span className="ml-auto bg-[#db5641] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {playedCount}/{activeLevels.length}
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
                <span>{t('tab_store', language)}</span>
                <span className="ml-auto bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-sm">
                  🪙
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'leaderboard'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span>{t('tab_leaderboard', language)}</span>
              </button>

              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                  activeTab === 'achievements'
                    ? 'bg-[#3d312a] text-[#faf6ee] shadow-md'
                    : 'text-[#3d312a]/70 hover:bg-[#3d312a]/5 hover:text-[#3d312a]'
                }`}
              >
                <Star className="w-4 h-4 shrink-0" />
                <span>{t('tab_achievements', language)}</span>
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
                <span>{t('tab_howToPlay', language)}</span>
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
                <span>{t('tab_settings', language)}</span>
              </button>

              {/* Console Tab - EXCLUSIVELY FOR MARTIN */}
              {isMartin && (
                <button
                  onClick={() => setActiveTab('console')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 border border-amber-400/50 mt-1 ${
                    activeTab === 'console'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 shadow-md font-black ring-2 ring-amber-400/50'
                      : 'bg-amber-400/15 text-amber-900 hover:bg-amber-400/25'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                  <span>Console</span>
                  <span className="ml-auto bg-amber-950 text-amber-300 text-[9px] px-1.5 py-0.5 rounded-full font-black">
                    ADMIN
                  </span>
                </button>
              )}
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

          {/* Player Account & Cloud Sync Module */}
          <div className="flex flex-col gap-2.5 p-4 bg-[#faf6ee]/60 border border-[#3d312a]/10 rounded-2xl text-xs mt-auto">
            {!firebaseConfigured ? (
              <div className="space-y-1.5 text-center py-0.5">
                <div className="flex items-center justify-center gap-1 font-bold text-[#db5641]">
                  <CloudOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Cloud Save Offline</span>
                </div>
                <p className="text-[10px] text-[#7a7065] font-semibold leading-normal">
                  To enable Cloud Saves, complete the companion <b className="text-[#db5641]">"Set up Firebase"</b> step in your AI Studio panel.
                </p>
              </div>
            ) : !user ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#3d312a]">
                    <Cloud className="w-4 h-4 shrink-0 text-[#db5641]" />
                    <span>Player Account</span>
                  </div>
                  <span className="text-[9px] font-bold text-[#6ca750] bg-[#6ca750]/10 px-1.5 py-0.5 rounded-full">
                    Cloud Save
                  </span>
                </div>
                <p className="text-[10px] text-[#7a7065] font-medium leading-normal">
                  Sign in with your <b>Email</b> or <b>Google</b> account to backup your 60-hole progress and gold coins.
                </p>

                {typeof window !== 'undefined' && window.self !== window.top && (
                  <div className="space-y-1.5 border border-[#db5641]/20 bg-[#db5641]/5 p-2 rounded-xl">
                    <p className="text-[9px] text-[#db5641] font-bold leading-normal">
                      ⚠️ Playing in the preview panel? For Google popup sign-in, open in a new tab:
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full bg-[#6ca750] hover:bg-[#5b9042] text-white py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all active:scale-95 text-[10px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Open in New Tab</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                    }}
                    className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[11px] shadow-sm cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Sign In with Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={onLogin}
                    className="w-full bg-white hover:bg-[#faf6ee] border border-[#3d312a]/20 text-[#3d312a] py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[11px] cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#db5641]" />
                    <span>Sign In with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                    }}
                    className="w-full text-center text-[10px] text-[#7a7065] hover:text-[#3d312a] font-bold py-0.5 transition-colors"
                  >
                    Don't have an account? <span className="underline text-[#db5641]">Create one</span>
                  </button>
                </div>

                {/* Highly descriptive Troubleshooting block if Auth fails */}
                {authError && (
                  <div className="mt-2 p-2.5 bg-red-50/90 border border-red-200 rounded-xl text-left text-[10px] text-red-800 space-y-1.5 transition-all animate-fade-in shadow-sm">
                    <div className="flex items-start gap-1.5 font-bold text-red-900 leading-tight">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <span>Auth Notice ({authError.code || 'Notice'})</span>
                        <p className="text-[9px] text-red-700 font-medium leading-normal mt-0.5">
                          {authError.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-1.5 border-t border-red-200/50 space-y-1.5 text-[9px] text-red-800">
                      <p className="font-bold text-red-950">Troubleshooting Tips:</p>
                      <p className="leading-relaxed text-red-900">
                        If using Email/Password, make sure Email provider is enabled in Firebase Console. For Google Sign-in, authorize this domain.
                      </p>
                      <ol className="list-decimal list-inside space-y-1 pl-0.5 font-semibold text-red-950">
                        <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline text-red-900 font-extrabold hover:text-red-950">Firebase Console</a> &rarr; <b>Authentication</b></li>
                        <li><b>Sign-in method</b> tab &rarr; Enable <b>Email/Password</b> & <b>Google</b></li>
                        <li><b>Settings</b> tab &rarr; <b>Authorized domains</b> &rarr; Add domain: <code className="bg-red-100/80 px-1 py-0.5 rounded text-[8.5px] font-mono select-all font-bold">{typeof window !== 'undefined' ? window.location.hostname : 'your-domain.run.app'}</code></li>
                      </ol>
                      
                      <div className="pt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-900 font-extrabold py-1 px-1.5 rounded-md flex items-center justify-center gap-1 transition-colors text-[9px]"
                        >
                          {copied ? <Check className="w-2.5 h-2.5 text-[#6ca750]" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{copied ? 'Copied hostname!' : 'Copy Domain'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={onClearAuthError}
                          className="bg-white hover:bg-gray-100 border border-red-200 text-gray-700 py-1 px-1.5 rounded-md font-bold text-[9px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
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
                      className="w-8 h-8 rounded-full border border-[#3d312a]/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#db5641] text-white flex items-center justify-center font-black text-xs shadow-sm uppercase">
                      {user.displayName ? user.displayName.charAt(0) : user.email ? user.email.charAt(0) : 'P'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-[#3d312a] truncate text-[11px]">
                        {user.displayName || (user.email ? user.email.split('@')[0] : 'Golf Golfer')}
                      </p>
                      {isMartin && (
                        <span className="bg-amber-100 text-amber-900 text-[8px] font-black px-1.5 py-0.2 rounded border border-amber-300">
                          CREATOR
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-[#7a7065] truncate font-semibold leading-none mt-0.5">
                      {user.email || 'Synced Player'}
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
                    className="text-[#db5641] hover:text-[#c24a37] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Log out</span>
                  </button>
                </div>

                {/* Player Rank Summary Box */}
                <div 
                  onClick={() => setShowRanksModal(true)}
                  className="mt-2 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/25 rounded-xl p-2.5 cursor-pointer hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <RankLogo tier={currentRank.tier} size={28} />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black text-amber-950 leading-none">
                            {currentRank.name}
                          </span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-200/60 px-1 rounded">
                            T{currentRank.tier}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-[#7a7065]">
                          {playerRP} RP
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full bg-[#3d312a]/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, rankProg.progressPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-[#7a7065] mt-1">
                    <span>{rankedWins}W / {rankedMatches}M</span>
                    <span>{rankProg.nextTier ? `${rankProg.rpInTier}/${rankProg.rpForNextTier} RP` : 'MAX RANK'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email & Account Authentication Modal Overlay */}
        {showAuthModal && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#fcfaf4] border-2 border-[#3d312a] rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-[#3d312a]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthFormError(null);
                  setResetSuccessMsg(null);
                }}
                className="absolute top-4 right-4 text-[#7a7065] hover:text-[#3d312a] p-1.5 rounded-full hover:bg-[#3d312a]/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#db5641]/10 text-[#db5641] flex items-center justify-center mx-auto mb-2.5 font-bold">
                  {authMode === 'signup' ? <UserPlus className="w-6 h-6" /> : authMode === 'reset' ? <Key className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-black text-[#3d312a]">
                  {authMode === 'signup' ? 'Create Free Account' : authMode === 'reset' ? 'Reset Account Password' : 'Sign In to Golf Lab'}
                </h3>
                <p className="text-xs text-[#7a7065] mt-1 font-medium">
                  {authMode === 'signup' 
                    ? 'Save your custom golf balls, gold coins, and 60-hole records.' 
                    : authMode === 'reset'
                    ? 'Enter your email address and we will send a password reset link.'
                    : 'Sign in to access your cloud-saved balls, trails, and leaderboard stats.'}
                </p>
              </div>

              {/* Mode Switch Tabs */}
              {authMode !== 'reset' && (
                <div className="grid grid-cols-2 p-1 bg-[#eae3d2]/60 rounded-xl mb-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthFormError(null);
                      setResetSuccessMsg(null);
                    }}
                    className={`py-1.5 rounded-lg transition-all text-center ${authMode === 'signin' ? 'bg-white text-[#3d312a] shadow-sm' : 'text-[#7a7065] hover:text-[#3d312a]'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthFormError(null);
                      setResetSuccessMsg(null);
                    }}
                    className={`py-1.5 rounded-lg transition-all text-center ${authMode === 'signup' ? 'bg-white text-[#3d312a] shadow-sm' : 'text-[#7a7065] hover:text-[#3d312a]'}`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Google Sign-in Alternative (for signin or signup modes) */}
              {authMode !== 'reset' && (
                <div className="mb-4">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handleGoogleClick}
                    className="w-full py-2.5 px-4 bg-white hover:bg-[#faf6ee] border border-[#3d312a]/20 text-[#3d312a] rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-98 text-xs cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4 text-[#db5641]" />
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#3d312a]/15"></div>
                    </div>
                    <span className="relative px-3 bg-[#fcfaf4] text-[10px] text-[#7a7065] font-bold uppercase tracking-wider">
                      Or continue with email
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {authFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-950">Authentication Notice</p>
                    <p className="text-[11px] text-red-800 mt-0.5">{authFormError}</p>
                  </div>
                </div>
              )}

              {/* Success Message (Password Reset) */}
              {resetSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-emerald-950">Check Your Email</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">{resetSuccessMsg}</p>
                  </div>
                </div>
              )}

              {/* Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#3d312a] mb-1">
                      Golfer Name / Username (Optional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7065]" />
                      <input
                        type="text"
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        placeholder="e.g. Master Golfer"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#3d312a]/20 rounded-xl text-xs font-semibold text-[#3d312a] focus:outline-none focus:border-[#db5641]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#3d312a] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7065]" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#3d312a]/20 rounded-xl text-xs font-semibold text-[#3d312a] focus:outline-none focus:border-[#db5641]"
                    />
                  </div>
                </div>

                {authMode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-[#3d312a]">
                        Password
                      </label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('reset');
                            setAuthFormError(null);
                            setResetSuccessMsg(null);
                          }}
                          className="text-[10px] text-[#db5641] hover:underline font-bold"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7065]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                        className="w-full pl-9 pr-9 py-2 bg-white border border-[#3d312a]/20 rounded-xl text-xs font-semibold text-[#3d312a] focus:outline-none focus:border-[#db5641]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7065] hover:text-[#3d312a]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 bg-[#db5641] hover:bg-[#c24a37] text-white py-2.5 px-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : authMode === 'signup' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Free Account</span>
                    </>
                  ) : authMode === 'reset' ? (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Send Password Reset Email</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Email</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to signin link if in reset mode */}
              {authMode === 'reset' && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthFormError(null);
                      setResetSuccessMsg(null);
                    }}
                    className="text-xs text-[#7a7065] hover:text-[#3d312a] font-bold flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
                      <span className="text-2xl font-black text-[#6ca750] block">{playedCount} / {activeLevels.length}</span>
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
                <div className="bg-[#efe6d4]/50 border border-[#efe6d4] rounded-2xl p-4 flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 text-lg rounded-xl bg-[#db5641] text-white flex items-center justify-center font-black">
                      {currentLevelIndex + 1}
                    </span>
                    <div>
                      <span className="text-[10px] text-[#7a7065] font-extrabold uppercase block tracking-wider">Current Hole Selection</span>
                      <span className="font-extrabold text-[#3d312a] text-sm">{activeLevels[currentLevelIndex]?.name || `Level ${currentLevelIndex + 1}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7a7065] font-bold bg-[#faf6ee] px-2.5 py-1 rounded-full border border-[#3d312a]/10">
                    Par {activeLevels[currentLevelIndex]?.par}
                  </div>
                </div>

                {/* Quick Action Cards: Multiplayer 1v1 & Ranks System */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div 
                    onClick={() => setActiveTab('multiplayer')}
                    className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-600/5 border border-amber-500/30 hover:border-amber-500 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700">
                          <Swords className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-[#3d312a] text-sm group-hover:text-amber-700 transition-colors">
                            Modo Online 1v1
                          </h4>
                          <span className="text-[11px] text-[#7a7065] font-semibold">
                            Salas & Matchmaking
                          </span>
                        </div>
                      </div>
                      <span className="bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        RANKED
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-amber-800">
                      <span>Jugar con otros jugadores</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('ranks')}
                    className="bg-[#faf6ee] border border-[#3d312a]/15 hover:border-amber-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#3d312a]/5 flex items-center justify-center">
                          <RankLogo tier={currentRank.tier} size={32} />
                        </div>
                        <div>
                          <h4 className="font-black text-[#3d312a] text-sm group-hover:text-amber-700 transition-colors">
                            {currentRank.name}
                          </h4>
                          <span className="text-[11px] text-amber-700 font-bold font-mono">
                            {playerRP} RP (Tier {currentRank.tier}/7)
                          </span>
                        </div>
                      </div>
                      <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#3d312a]/80">
                      <span>Ver los 7 Rangos & Logos</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
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

          {/* TAB: MULTIPLAYER ONLINE MODE */}
          {activeTab === 'multiplayer' && (
            <div className="flex-1 flex flex-col -m-6 md:-m-8">
              <OnlineMultiplayerView
                currentUser={{
                  uid: user?.uid || `guest_${Math.random().toString(36).substring(2, 8)}`,
                  displayName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Golfista Invitado'),
                  email: user?.email
                }}
                playerRP={playerRP}
                equippedBallId={equippedBallId}
                equippedTrailId={equippedTrailId}
                levelIds={activeLevels.map((_, i) => i)}
                onStartMatch={(room) => {
                  onStartMultiplayerMatch(room);
                }}
                onOpenRanksModal={() => setShowRanksModal(true)}
                onBackToMenu={() => setActiveTab('play')}
                language={language}
              />
            </div>
          )}

          {/* TAB: RANKS SHOWCASE */}
          {activeTab === 'ranks' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setActiveTab('play')}
                      className="w-8 h-8 rounded-xl bg-[#3d312a]/5 hover:bg-[#3d312a]/10 flex items-center justify-center text-[#3d312a] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-[#3d312a]">{t('ranks_title', language)}</h2>
                      <p className="text-xs text-[#7a7065] font-semibold">
                        {t('ranks_subtitle', language)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl">
                    <RankLogo tier={currentRank.tier} size={24} />
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold block leading-none">{t('ranks_yourRank', language)}</span>
                      <span className="text-xs font-black text-amber-950 font-mono">{playerRP} RP</span>
                    </div>
                  </div>
                </div>

                {/* All 7 Ranks list */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {RANK_TIERS.map((tier) => {
                    const isUnlocked = playerRP >= tier.minRP;
                    const isCurrent = currentRank.tier === tier.tier;
                    const locTier = getLocalizedRankTier(tier, language);

                    return (
                      <div
                        key={tier.tier}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500 shadow-sm ring-2 ring-amber-400/30'
                            : isUnlocked
                            ? 'bg-white/80 border-[#3d312a]/15'
                            : 'bg-[#efe6d4]/20 border-[#3d312a]/10 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="shrink-0">
                            <RankLogo tier={tier.tier} size={44} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[#3d312a] truncate">
                                {locTier.name}
                              </span>
                              <span className="text-[10px] font-bold text-[#7a7065] bg-[#3d312a]/5 px-1.5 py-0.5 rounded">
                                {t('tab_ranks', language)} {tier.tier}
                              </span>
                              {isCurrent && (
                                <span className="bg-[#db5641] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                  {t('ranks_current', language)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#7a7065] font-semibold mt-0.5">
                              {locTier.elementDescription}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-[#3d312a] block">
                            {tier.maxRP === Infinity ? `${tier.minRP}+ RP` : `${tier.minRP} - ${tier.maxRP} RP`}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            {locTier.rewardPerWin}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setActiveTab('multiplayer')}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Swords className="w-4 h-4" />
                  <span>{t('tab_multiplayer', language)} (RP)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HOLE DIRECTORY SELECTOR */}
          {activeTab === 'levels' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="flex-1 overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-[#3d312a]">{t('levels_title', language)}</h2>
                  
                  {/* Rows level tabs groups */}
                  {currentWorld === 'classic' ? (
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
                  ) : (
                    <div className="flex bg-[#efe6d4] p-0.5 rounded-xl text-xs font-bold border border-[#3d312a]/5">
                      <span className="px-3 py-1.5 rounded-lg bg-[#121824] text-[#00f0ff] shadow-sm">
                        Cyber World (Holes 1-20)
                      </span>
                    </div>
                  )}
                </div>

                {/* Scrollable scroll panel grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 h-[340px] overflow-y-auto pr-1">
                  {getGroupLevels().map((lvl) => {
                    const idx = lvl.id - 1;
                    const best = getLevelBestScore(idx);
                    const isCompleted = best !== undefined;
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
                              <span className="opacity-40">{t('play', language)}</span>
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
                  💡 {t('levels_quickJump', language)}
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
              unlockedTrailIds={unlockedTrailIds}
              equippedTrailId={equippedTrailId}
              onBuyBall={onBuyBall}
              onEquipBall={onEquipBall}
              onBuyTrail={onBuyTrail}
              onEquipTrail={onEquipTrail}
              onAddCoins={onAddCoins}
              onUnlockItems={onUnlockItems}
              user={user}
              language={language}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView firebaseConfigured={firebaseConfigured} currentUserUid={user?.uid || null} language={language} />
          )}

          {activeTab === 'achievements' && (
            <AchievementsView
              bestScores={bestScores}
              coins={coins}
              unlockedBallIds={unlockedBallIds}
              language={language}
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
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200 overflow-y-auto pr-1 relative">
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-[#3d312a] flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#db5641]" /> {t('set_title', language)}
                  </h2>

                  {/* Secret Easter Egg Corner Button */}
                  <button
                    type="button"
                    onClick={() => setShowSecretSoundModal(true)}
                    title="Rincón Secreto 🔊"
                    className="p-1.5 text-[#3d312a]/30 hover:text-amber-500 hover:bg-amber-500/15 rounded-xl transition-all cursor-pointer group flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform text-amber-500/70 group-hover:text-amber-500" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-amber-700 hidden sm:inline">¿?</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Language Selector Option */}
                  <div className="bg-[#faf6ee] p-4 rounded-2xl border border-[#3d312a]/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 bg-blue-500/10 rounded-xl text-blue-600 flex items-center justify-center font-bold">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#3d312a] text-sm flex items-center gap-2">
                          {t('set_language', language)}
                          <span className="text-[10px] bg-amber-500/15 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase">
                            {SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}
                          </span>
                        </h4>
                        <p className="text-xs text-[#7a7065] mt-0.5 leading-relaxed font-semibold">
                          {t('set_language_desc', language)}
                        </p>
                      </div>
                    </div>

                    {/* Language selector grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                      {SUPPORTED_LANGUAGES.map((langItem) => {
                        const isSelected = language === langItem.code;
                        return (
                          <button
                            key={langItem.code}
                            type="button"
                            onClick={() => {
                              onLanguageChange(langItem.code);
                              saveLanguage(langItem.code);
                            }}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-sm scale-[1.02]'
                                : 'bg-white hover:bg-[#efe6d4] text-[#3d312a] border-[#3d312a]/10'
                            }`}
                          >
                            <span className="text-xl shrink-0">{langItem.flag}</span>
                            <div className="min-w-0">
                              <span className="block text-xs font-black truncate">{langItem.name}</span>
                              <span className={`block text-[9px] uppercase tracking-wider font-semibold truncate ${
                                isSelected ? 'text-amber-300' : 'text-[#7a7065]'
                              }`}>
                                {langItem.code.toUpperCase()}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 ml-auto shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Caddy Toggle Option */}
                  <div className="bg-[#faf6ee] p-4 rounded-2xl border border-[#3d312a]/10 flex items-center justify-between gap-4">
                    <div className="flex gap-3 items-start">
                      <div className="h-10 w-10 shrink-0 bg-[#db5641]/10 rounded-xl text-[#db5641] flex items-center justify-center font-bold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#3d312a] text-sm">{t('set_caddy', language)}</h4>
                        <p className="text-xs text-[#7a7065] mt-0.5 leading-relaxed font-semibold">
                          {t('set_caddy_desc', language)}
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
                    <h5 className="text-[#3d312a] font-extrabold text-xs mb-1.5">{t('set_accessibility_tip', language)}</h5>
                    <p className="text-[11px] text-[#7a7065] font-semibold leading-relaxed">
                      {t('set_accessibility_desc', language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onStartGame(currentLevelIndex)}
                  className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-4 px-6 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('menu_startHole', language)} {currentLevelIndex + 1}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: CONSOLE (EXCLUSIVELY FOR MARTIN) */}
          {activeTab === 'console' && isMartin && (
            <ConsoleView
              user={user}
              coins={coins}
              unlockedBallIds={unlockedBallIds}
              equippedBallId={equippedBallId}
              unlockedTrailIds={unlockedTrailIds}
              equippedTrailId={equippedTrailId}
              onBuyBall={onBuyBall}
              onEquipBall={onEquipBall}
              onBuyTrail={onBuyTrail}
              onEquipTrail={onEquipTrail}
              onAddCoins={onAddCoins}
              onUnlockItems={onUnlockItems}
              bestScores={bestScores}
              onUnlockAllLevels={onUnlockAllLevels}
              onSetAllScoresHIO={onSetAllScoresHIO}
            />
          )}
        </div>
      </div>

      {/* Ranks & Tier Badges Modal */}
      <RanksModal
        isOpen={showRanksModal}
        onClose={() => setShowRanksModal(false)}
        currentRP={playerRP}
        rankedWins={rankedWins}
        rankedMatches={rankedMatches}
        language={language}
      />

      {/* Secret Audio Easter Egg Modal */}
      <SecretSoundModal
        isOpen={showSecretSoundModal}
        onClose={() => setShowSecretSoundModal(false)}
        language={language}
      />
    </div>
  );
};
