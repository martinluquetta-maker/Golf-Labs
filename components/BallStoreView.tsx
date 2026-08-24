/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BallItem, 
  TrailItem, 
  BALLS_STORE_ITEMS, 
  TRAILS_STORE_ITEMS, 
  EXCLUSIVE_BALLS,
  EXCLUSIVE_TRAILS,
  CHESTS, 
  ChestType,
  RARITIES, 
  ItemRarity,
  getDailyShopItems,
  redeemCreatorGiftCode
} from './BallStoreData';
import { 
  Coins, 
  CheckCircle, 
  ShoppingBag, 
  Sparkles, 
  Clock, 
  Package, 
  Layers, 
  Search, 
  Filter, 
  Info,
  Gift,
  Flame,
  Zap,
  Star,
  Check,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  checkMatchingGrants 
} from '../services/firebase';
import useAudio from '../hooks/useAudio';
import { getPath } from '../utils/path';

interface BallStoreViewProps {
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
  user?: any;
  onClose?: () => void;
}

export const BallStoreView: React.FC<BallStoreViewProps> = ({
  coins,
  unlockedBallIds = ['classic_white'],
  equippedBallId = 'classic_white',
  unlockedTrailIds = ['trail_dust_white'],
  equippedTrailId = 'trail_dust_white',
  onBuyBall,
  onEquipBall,
  onBuyTrail = () => {},
  onEquipTrail = () => {},
  onAddCoins,
  onUnlockItems = () => {},
  user,
  onClose,
}) => {
  const { playForeground } = useAudio();
  const [activeTab, setActiveTab] = useState<'daily' | 'chests' | 'locker' | 'catalog'>('daily');
  const [lockerType, setLockerType] = useState<'balls' | 'trails'>('balls');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Daily shop live state
  const [dailyData, setDailyData] = useState(() => getDailyShopItems());
  
  // Unboxing modal state
  const [isUnboxing, setIsUnboxing] = useState(false);
  const [unboxingStage, setUnboxingStage] = useState<'shaking' | 'revealed'>('shaking');
  const [unboxedResult, setUnboxedResult] = useState<{
    balls: { item: BallItem; isNew: boolean; refund: number }[];
    trails: { item: TrailItem; isNew: boolean; refund: number }[];
    chest: ChestType;
  } | null>(null);

  // Player Direct Claim/Check State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimLookupInput, setClaimLookupInput] = useState('');
  const [claimFeedback, setClaimFeedback] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isLoadingGrants, setIsLoadingGrants] = useState(false);
  const [autoClaimedNotification, setAutoClaimedNotification] = useState<string | null>(null);

  // Automatic Background Check on Mount for recipient user
  useEffect(() => {
    const checkGrants = async () => {
      const email = user?.email || localStorage.getItem('player_email') || '';
      const name = user?.displayName || localStorage.getItem('player_username') || '';
      if (!email && !name) return;

      const result = await checkMatchingGrants(email, name);
      if (result.matchedGrants.length > 0) {
        const newBalls = result.ballIds.filter(b => !unlockedBallIds.includes(b));
        const newTrails = result.trailIds.filter(t => !unlockedTrailIds.includes(t));
        if (newBalls.length > 0 || newTrails.length > 0) {
          onUnlockItems(result.ballIds, result.trailIds);
          result.ballIds.forEach(bId => onBuyBall(bId, 0));
          result.trailIds.forEach(tId => onBuyTrail(tId, 0));
          setAutoClaimedNotification(`🎉 Martin Luquetta granted you exclusive access to: ${result.matchedGrants.map(g => g.setName).join(', ')}!`);
        }
      }
    };
    checkGrants();
  }, [user, onUnlockItems, onBuyBall, onBuyTrail, unlockedBallIds, unlockedTrailIds]);

  // Update countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDailyData(getDailyShopItems());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckClaimGifts = async (identifier?: string) => {
    const target = (identifier || claimLookupInput || user?.email || user?.displayName || '').trim();
    if (!target) {
      setClaimFeedback({ success: false, message: 'Please enter your account name or email address.' });
      return;
    }
    setIsLoadingGrants(true);
    const check = await checkMatchingGrants(target, target, target);
    setIsLoadingGrants(false);

    if (check.matchedGrants.length > 0) {
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
      onUnlockItems(check.ballIds, check.trailIds);
      check.ballIds.forEach(bId => onBuyBall(bId, 0));
      check.trailIds.forEach(tId => onBuyTrail(tId, 0));
      if (check.ballIds.length > 0) onEquipBall(check.ballIds[0]);
      if (check.trailIds.length > 0) onEquipTrail(check.trailIds[0]);

      const setNames = Array.from(new Set(check.matchedGrants.map(g => g.setName))).join(', ');
      setClaimFeedback({
        success: true,
        message: `🎉 Success! Martin Luquetta granted you: ${setNames}! The items are unlocked and equipped!`,
        count: check.ballIds.length + check.trailIds.length
      });
    } else {
      playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
      setClaimFeedback({
        success: false,
        message: `No active gifts found for "${target}". Please check the spelling or ask Martin (martin.luquetta@sgs.edu.co) to grant access to your account name or email!`,
      });
    }
  };

  const handleBuyBallClick = (item: BallItem) => {
    if (coins >= item.price) {
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
      onBuyBall(item.id, item.price);
    } else {
      playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
    }
  };

  const handleBuyTrailClick = (item: TrailItem) => {
    if (coins >= item.price) {
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
      onBuyTrail(item.id, item.price);
    } else {
      playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
    }
  };

  const handleEquipBallClick = (id: string) => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    onEquipBall(id);
  };

  const handleEquipTrailClick = (id: string) => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    onEquipTrail(id);
  };

  // Open Mystery Chest logic
  const handleOpenChest = (chest: ChestType) => {
    if (coins < chest.price) {
      playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
      return;
    }

    playForeground(getPath("/media/audio/sfx/minigolf/goal.mp3"));
    setIsUnboxing(true);
    setUnboxingStage('shaking');

    // Deduct chest cost
    if (onAddCoins) {
      onAddCoins(-chest.price);
    }

    const isBoosted = chest.id === 'mega_crate';
    const unboxedBalls: { item: BallItem; isNew: boolean; refund: number }[] = [];
    const unboxedTrails: { item: TrailItem; isNew: boolean; refund: number }[] = [];

    if (chest.type === 'ball' || chest.type === 'both') {
      // Pick random rarity based on odds
      const rand = Math.random() * 100;
      let targetRarity: ItemRarity = 'common';
      if (isBoosted) {
        if (rand < 8) targetRarity = 'mythical';
        else if (rand < 32) targetRarity = 'legendary';
        else if (rand < 70) targetRarity = 'rare';
      } else {
        if (rand < 4) targetRarity = 'mythical';
        else if (rand < 18) targetRarity = 'legendary';
        else if (rand < 50) targetRarity = 'rare';
      }
      const pool = BALLS_STORE_ITEMS.filter(b => b.rarity === targetRarity);
      const pickedBall = pool[Math.floor(Math.random() * pool.length)] || BALLS_STORE_ITEMS[0];
      const isOwned = unlockedBallIds.includes(pickedBall.id);
      const refund = isOwned ? Math.round(chest.price * 0.5) : 0;
      
      if (!isOwned) {
        onBuyBall(pickedBall.id, 0); // Grant ball for free from chest
      } else if (refund > 0 && onAddCoins) {
        onAddCoins(refund);
      }
      unboxedBalls.push({ item: pickedBall, isNew: !isOwned, refund });
    }

    if (chest.type === 'trail' || chest.type === 'both') {
      const rand = Math.random() * 100;
      let targetRarity: ItemRarity = 'common';
      if (isBoosted) {
        if (rand < 8) targetRarity = 'mythical';
        else if (rand < 32) targetRarity = 'legendary';
        else if (rand < 70) targetRarity = 'rare';
      } else {
        if (rand < 4) targetRarity = 'mythical';
        else if (rand < 18) targetRarity = 'legendary';
        else if (rand < 50) targetRarity = 'rare';
      }
      const pool = TRAILS_STORE_ITEMS.filter(t => t.rarity === targetRarity);
      const pickedTrail = pool[Math.floor(Math.random() * pool.length)] || TRAILS_STORE_ITEMS[0];
      const isOwned = unlockedTrailIds.includes(pickedTrail.id);
      const refund = isOwned ? Math.round(chest.price * 0.5) : 0;
      
      if (!isOwned) {
        onBuyTrail(pickedTrail.id, 0); // Grant trail for free from chest
      } else if (refund > 0 && onAddCoins) {
        onAddCoins(refund);
      }
      unboxedTrails.push({ item: pickedTrail, isNew: !isOwned, refund });
    }

    setUnboxedResult({
      balls: unboxedBalls,
      trails: unboxedTrails,
      chest,
    });

    // Reveal after 1.8s shake animation
    setTimeout(() => {
      setUnboxingStage('revealed');
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
    }, 1800);
  };

  // High-fidelity preview rendering for Balls
  const renderBallPreview = (item: BallItem, size = 'w-12 h-12') => {
    const isMythical = item.rarity === 'mythical';
    const isLegendary = item.rarity === 'legendary';

    // Net exclusive ball preview
    if (item.pattern === 'net' || item.id === 'exclusive_net') {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-cyan-400/60`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #1e293b 0%, #0f172a 70%, #020617 100%)',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.8), inset 0 -3px 6px rgba(0,0,0,0.6)',
          }}
        >
          <div className="absolute bottom-0 inset-x-0 h-3.5 bg-[#c28b52] border-t border-cyan-400/30"></div>
          <svg className="absolute inset-0 w-full h-full p-1 opacity-90" viewBox="0 0 40 40">
            <polygon points="20,6 10,18 30,18" fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <polygon points="10,18 20,30 30,18" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="20" y1="6" x2="20" y2="30" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="6" y1="20" x2="34" y2="20" stroke="#38bdf8" strokeWidth="0.8" />
            <circle cx="20" cy="6" r="1.5" fill="#38bdf8" />
            <circle cx="10" cy="18" r="1.5" fill="#ffffff" />
            <circle cx="30" cy="18" r="1.5" fill="#ffffff" />
            <circle cx="20" cy="30" r="1.5" fill="#38bdf8" />
          </svg>
          <div className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-white/70"></div>
        </div>
      );
    }

    // Scribble exclusive ball preview
    if (item.pattern === 'scribble' || item.id === 'exclusive_scribble') {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-rose-400/60`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)',
            boxShadow: '0 0 14px rgba(244, 63, 94, 0.7), inset 0 -3px 6px rgba(0,0,0,0.2)',
          }}
        >
          <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 40 40">
            <path 
              d="M 12,12 C 8,8 24,6 28,14 C 32,22 14,24 16,32 C 18,36 30,30 32,24" 
              fill="none" 
              stroke="#09090b" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />
            <circle cx="14" cy="16" r="1.5" fill="#f43f5e" />
            <circle cx="28" cy="28" r="1.8" fill="#f43f5e" />
            <circle cx="24" cy="12" r="1.2" fill="#09090b" />
          </svg>
          <div className="absolute top-1.5 left-2 w-2 h-1 rounded-full bg-white/90"></div>
        </div>
      );
    }

    if (item.specialType === 'gold') {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg border border-[#ffd700]/50 animate-pulse`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #fff9b5 0%, #ffd700 50%, #b58900 100%)',
            boxShadow: '0 0 16px rgba(255, 215, 0, 0.7), inset 0 -4px 8px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Sparkles className="w-4 h-4 text-white opacity-95 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      );
    }

    if (item.specialType === '8ball') {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg border border-black`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #4a4a4a 0%, #1a1a1a 60%, #000000 100%)',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.6)',
          }}
        >
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-black text-black text-[10px] font-mono">
            8
          </div>
        </div>
      );
    }

    if (item.specialType === 'donut') {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-amber-900/40`}
          style={{
            background: 'radial-gradient(circle at 30% 30%, #ffd0e8 0%, #ffb5d8 60%, #e070a8 100%)',
            boxShadow: 'inset 0 -4px 6px rgba(138, 79, 29, 0.4)',
          }}
        >
          <div className="absolute w-3.5 h-3.5 rounded-full bg-[#faf6ee] border border-amber-900/20 shadow-inner"></div>
          <div className="absolute top-1.5 left-2 w-1.5 h-0.5 bg-blue-400 rounded-full rotate-45"></div>
          <div className="absolute top-1.5 right-2.5 w-1.5 h-0.5 bg-yellow-400 rounded-full -rotate-45"></div>
          <div className="absolute bottom-2 left-2.5 w-1.5 h-0.5 bg-purple-400 rounded-full rotate-12"></div>
        </div>
      );
    }

    if (item.specialType === 'cosmic' || isMythical) {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg border border-purple-400/40 animate-pulse`}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${item.color} 0%, #1e1b4b 60%, #020617 100%)`,
            boxShadow: item.glowColor ? `0 0 16px ${item.glowColor}, inset 0 -3px 6px rgba(0,0,0,0.5)` : '0 0 14px rgba(168, 85, 247, 0.8)',
          }}
        >
          <div className="absolute w-1 h-1 bg-white rounded-full top-1.5 right-2 animate-ping"></div>
          <div className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full bottom-2 left-2 blur-[0.5px]"></div>
          <Sparkles className="w-3.5 h-3.5 text-white/90" />
        </div>
      );
    }

    if (item.specialType === 'fire' || item.specialType === 'dragon') {
      return (
        <div 
          className={`relative ${size} rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-orange-500/50`}
          style={{
            background: 'radial-gradient(circle at 30% 30%, #fef08a 0%, #f97316 50%, #7f1d1d 100%)',
            boxShadow: '0 0 16px rgba(249, 115, 22, 0.8), inset 0 -3px 6px rgba(0,0,0,0.4)',
          }}
        >
          <Flame className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
        </div>
      );
    }

    // Default golf ball styling with dimples, stripes, rings
    return (
      <div 
        className={`relative ${size} rounded-full flex items-center justify-center shadow-md border border-[#3d312a]/15`}
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${item.color} 55%, #78716c 100%)`,
          boxShadow: isLegendary && item.glowColor ? `0 0 12px ${item.glowColor}, inset 0 -3px 5px rgba(0,0,0,0.2)` : 'inset 0 -3px 5px rgba(0,0,0,0.2)',
        }}
      >
        {/* Dimples texture */}
        <div className="absolute inset-1.5 grid grid-cols-3 gap-0.5 opacity-15 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-0.5 h-0.5 rounded-full bg-black"></div>
          ))}
        </div>

        {item.pattern === 'stripe' && (
          <div 
            className="absolute h-1.5 w-full pointer-events-none rotate-[25deg]"
            style={{ backgroundColor: item.secondaryColor || '#1c1917' }}
          ></div>
        )}

        {item.pattern === 'dual_ring' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full border border-orange-500/80"></div>
            <div className="w-6 h-6 rounded-full border border-black/50 absolute"></div>
          </div>
        )}

        {item.pattern === 'truvis' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none">
            <div className="w-2.5 h-2.5 bg-red-600 rotate-45 transform absolute -top-0.5"></div>
            <div className="w-2.5 h-2.5 bg-red-600 -rotate-45 transform absolute -bottom-0.5"></div>
            <div className="w-2 h-2 bg-red-600 rounded-full absolute"></div>
          </div>
        )}

        {item.pattern === 'number' && (
          <span className="text-[9px] text-red-600 font-black font-mono">1</span>
        )}
      </div>
    );
  };

  // High-fidelity preview rendering for Putting Trails
  const renderTrailPreview = (item: TrailItem) => {
    return (
      <div 
        className="relative w-full h-12 rounded-xl flex items-center px-3 overflow-hidden bg-stone-900 border border-stone-800"
        style={{
          boxShadow: item.glowColor ? `0 0 12px ${item.glowColor}` : undefined,
        }}
      >
        {/* Golf ball miniature on the left */}
        <div className="w-4 h-4 rounded-full bg-white shadow-sm shrink-0 border border-stone-300 z-10"></div>
        
        {/* Dynamic tail particle stream */}
        <div className="flex-1 flex items-center gap-1.5 pl-2 relative">
          {item.particleType === 'mesh' && (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border border-cyan-400 rotate-45 flex items-center justify-center shadow-[0_0_8px_#38bdf8] animate-spin" style={{ animationDuration: '6s' }}>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="w-3 h-0.5 bg-cyan-300"></div>
              <div className="w-2.5 h-2.5 border border-cyan-400 rotate-12 flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-200"></div>
              </div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
            </div>
          )}

          {item.particleType === 'scribble' && (
            <div className="flex items-center gap-1 text-rose-400">
              <span className="font-mono text-sm font-black animate-pulse">〰️</span>
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></div>
              <span className="font-mono text-xs font-bold text-white">~</span>
              <div className="w-1.5 h-1.5 rounded-full bg-black border border-white"></div>
            </div>
          )}

          {item.particleType === 'flame' && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping opacity-80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-600 opacity-60"></div>
            </div>
          )}

          {item.particleType === 'lightning' && (
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Zap className="w-3.5 h-3.5 animate-bounce" />
              <div className="w-4 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#38bdf8]"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          )}

          {item.particleType === 'star' && (
            <div className="flex items-center gap-1 text-yellow-300">
              <Star className="w-3 h-3 fill-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
              <Sparkles className="w-2.5 h-2.5 text-purple-300" />
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}

          {item.particleType === 'coins' && (
            <div className="flex items-center gap-1">
              <span className="text-xs animate-bounce">🪙</span>
              <span className="text-[10px] text-yellow-400 font-bold">$</span>
              <div className="w-2 h-2 rounded-full bg-yellow-300"></div>
            </div>
          )}

          {item.particleType === 'rainbow' && (
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 via-blue-500 to-purple-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>
          )}

          {item.particleType === 'laser' && (
            <div 
              className="h-1.5 w-full rounded-full"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 10px ${item.color}`,
              }}
            ></div>
          )}

          {item.particleType === 'galaxy' && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_#818cf8] animate-spin"></div>
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <div className="w-1 h-1 rounded-full bg-white animate-ping"></div>
            </div>
          )}

          {/* Standard dust/bubble particles */}
          {['dust', 'bubble', 'smoke', 'sakura', 'ice', 'matrix', 'hearts', 'glitch', 'aurora', 'phoenix', 'portal'].includes(item.particleType) && (
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: item.color }}
              ></div>
              <div 
                className="w-2 h-2 rounded-full opacity-80"
                style={{ backgroundColor: item.secondaryColor || item.color }}
              ></div>
              <div 
                className="w-1.5 h-1.5 rounded-full opacity-60"
                style={{ backgroundColor: item.color }}
              ></div>
              <div 
                className="w-1 h-1 rounded-full opacity-40"
                style={{ backgroundColor: item.secondaryColor || item.color }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter items for Locker & Catalog
  const filterList = <T extends BallItem | TrailItem>(list: T[]): T[] => {
    return list.filter(item => {
      const matchRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
      const matchSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRarity && matchSearch;
    });
  };

  const ownedBallsCount = unlockedBallIds.length;
  const ownedTrailsCount = unlockedTrailIds.length;

  return (
    <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
      <div className="flex-1 overflow-visible">
        {/* Top Header Bar */}
        <div className="bg-[#efe6d4] border border-[#3d312a]/10 p-3.5 rounded-3xl mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#db5641] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> Pro Shop
              </span>
              <h2 className="text-lg font-black text-[#3d312a]">Balls & Putting Trails</h2>
            </div>
            <p className="text-xs text-[#7a7065] font-semibold mt-0.5">
              Owned: <strong className="text-[#3d312a]">{ownedBallsCount}/102 Balls</strong> • <strong className="text-[#3d312a]">{ownedTrailsCount}/102 Trails</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Check Gifts Button for all players */}
            <button
              type="button"
              onClick={() => {
                playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
                setClaimFeedback(null);
                setShowClaimModal(true);
              }}
              className="bg-[#3d312a] hover:bg-[#2a221d] text-[#faf6ee] text-xs font-black px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-[#3d312a]/20 active:scale-95"
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>Check Gifts</span>
            </button>

            {/* Coins Balance Indicator */}
            <div className="bg-[#db5641] text-white px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-sm border border-[#db5641]/20">
              <Coins className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <div className="flex flex-col text-right">
                <span className="text-sm font-black leading-none">{coins.toLocaleString()}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-85 mt-0.5 leading-none">Coins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Claimed Gift Notification Banner */}
        {autoClaimedNotification && (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400/60 p-3 rounded-2xl mb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{autoClaimedNotification}</span>
            </div>
            <button
              onClick={() => setAutoClaimedNotification(null)}
              className="p-1 rounded-full hover:bg-amber-400/30 text-amber-900 text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sub-Navigation Tabs: Daily Shop, Mystery Chests, My Locker, Catalog */}
        <div className="flex bg-[#efe6d4]/60 p-1 rounded-2xl border border-[#3d312a]/10 mb-4 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'daily' 
                ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm' 
                : 'text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#db5641]" />
            <span>Daily Shop</span>
            <span className="bg-[#db5641] text-white text-[9px] px-1.5 py-0.2 rounded-full">5+5</span>
          </button>

          <button
            onClick={() => setActiveTab('chests')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chests' 
                ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm' 
                : 'text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>Mystery Chests</span>
          </button>

          <button
            onClick={() => setActiveTab('locker')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'locker' 
                ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm' 
                : 'text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-blue-500" />
            <span>My Locker ({ownedBallsCount + ownedTrailsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'catalog' 
                ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm' 
                : 'text-[#7a7065] hover:text-[#3d312a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>All 200 Items & Odds</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: DAILY ROTATING SHOP (5 BALLS + 5 TRAILS) */}
        {/* ================================================================= */}
        {activeTab === 'daily' && (
          <div className="space-y-4 h-[330px] overflow-y-auto pr-1">
            {/* Daily Countdown Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#db5641]" />
                <div>
                  <h4 className="text-xs font-black text-[#3d312a] uppercase tracking-wider">Today's Daily Rotation</h4>
                  <p className="text-[10px] text-[#7a7065] font-semibold">5 Unique Balls & 5 Unique Trails featured for direct coin unlock!</p>
                </div>
              </div>
              <div className="bg-[#3d312a] text-[#faf6ee] px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3 h-3 text-[#db5641]" />
                <span>Resets in: {dailyData.resetTime}</span>
              </div>
            </div>

            {/* 5 Daily Balls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-[#3d312a] uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚽</span> Featured Daily Golf Balls
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dailyData.balls.map((item) => {
                  const isUnlocked = unlockedBallIds.includes(item.id);
                  const isEquipped = item.id === equippedBallId;
                  const canAfford = coins >= item.price;
                  const rarityCfg = RARITIES[item.rarity];

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all select-none ${
                        isEquipped 
                          ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-md' 
                          : isUnlocked 
                          ? 'bg-white hover:bg-[#efe6d4]/30 border-[#3d312a]/10 text-[#3d312a]' 
                          : 'bg-white/70 border-[#3d312a]/10 text-[#3d312a]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">{renderBallPreview(item)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md border ${rarityCfg.badgeBg}`}>
                              {rarityCfg.name}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs truncate leading-snug mt-1">
                            {item.name}
                          </h4>
                          <p className={`text-[10px] line-clamp-1 mt-0.5 ${isEquipped ? 'text-stone-300' : 'text-[#7a7065]'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#3d312a]/10 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold flex items-center gap-1 text-[#db5641]">
                          <Coins className="w-3 h-3" /> {item.price} Coins
                        </span>

                        {isEquipped ? (
                          <span className="text-[#6ca750] text-[10px] font-black flex items-center gap-1 bg-[#6ca750]/15 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Equipped
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipBallClick(item.id)}
                            className="bg-[#efe6d4] hover:bg-[#3d312a] hover:text-[#faf6ee] text-[#3d312a] text-[10px] font-black px-3 py-1 rounded-full transition-all cursor-pointer"
                          >
                            Equip
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleBuyBallClick(item)}
                            className={`text-[10px] font-black px-3 py-1 rounded-xl flex items-center gap-1 transition-all shadow-sm ${
                              canAfford 
                                ? 'bg-[#db5641] hover:bg-[#c24a37] text-white cursor-pointer active:scale-95' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 Daily Trails */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-[#3d312a] uppercase tracking-wider flex items-center gap-1.5">
                  <span>✨</span> Featured Daily Putting Trails
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dailyData.trails.map((item) => {
                  const isUnlocked = unlockedTrailIds.includes(item.id);
                  const isEquipped = item.id === equippedTrailId;
                  const canAfford = coins >= item.price;
                  const rarityCfg = RARITIES[item.rarity];

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all select-none ${
                        isEquipped 
                          ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-md' 
                          : isUnlocked 
                          ? 'bg-white hover:bg-[#efe6d4]/30 border-[#3d312a]/10 text-[#3d312a]' 
                          : 'bg-white/70 border-[#3d312a]/10 text-[#3d312a]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md border ${rarityCfg.badgeBg}`}>
                            {rarityCfg.name}
                          </span>
                          <span className="text-[9px] font-extrabold text-[#db5641] flex items-center gap-0.5">
                            <Coins className="w-2.5 h-2.5" /> {item.price}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs truncate mb-1">{item.name}</h4>
                        {renderTrailPreview(item)}
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#3d312a]/10 flex items-center justify-between">
                        <p className={`text-[9px] truncate max-w-[110px] ${isEquipped ? 'text-stone-300' : 'text-[#7a7065]'}`}>
                          {item.description}
                        </p>

                        {isEquipped ? (
                          <span className="text-[#6ca750] text-[10px] font-black flex items-center gap-1 bg-[#6ca750]/15 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipTrailClick(item.id)}
                            className="bg-[#efe6d4] hover:bg-[#3d312a] hover:text-[#faf6ee] text-[#3d312a] text-[10px] font-black px-3 py-1 rounded-full transition-all cursor-pointer"
                          >
                            Equip
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleBuyTrailClick(item)}
                            className={`text-[10px] font-black px-3 py-1 rounded-xl flex items-center gap-1 transition-all shadow-sm ${
                              canAfford 
                                ? 'bg-[#db5641] hover:bg-[#c24a37] text-white cursor-pointer active:scale-95' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: MYSTERY CHESTS (BALL CHEST, TRAIL BOX, MEGA CRATE) */}
        {/* ================================================================= */}
        {activeTab === 'chests' && (
          <div className="space-y-4 h-[330px] overflow-y-auto pr-1">
            <div className="bg-[#efe6d4]/50 border border-[#3d312a]/10 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-[#3d312a] uppercase tracking-wider">Mystery Crate Unboxing Vault</h3>
                <p className="text-[10px] text-[#7a7065] font-semibold mt-0.5">
                  Try your luck! Unbox random items across all 4 rarity tiers. Duplicate items automatically refund 50% Coins!
                </p>
              </div>
              <div className="text-[10px] font-bold text-[#db5641] bg-white px-2.5 py-1 rounded-xl border border-[#3d312a]/10">
                ⭐ 4% Mythical Odds
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {CHESTS.map((chest) => {
                const canAfford = coins >= chest.price;

                return (
                  <div 
                    key={chest.id}
                    className="bg-white border border-[#3d312a]/15 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all text-center relative overflow-hidden group"
                  >
                    {chest.id === 'mega_crate' && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-white text-[8px] font-black uppercase px-2.5 py-0.5 rounded-bl-xl shadow-sm">
                        2X Mythical Luck!
                      </div>
                    )}

                    <div>
                      {/* 3D Animated Chest Visual representation */}
                      <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-b from-[#efe6d4] to-[#e5d8c0] border border-[#3d312a]/20 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                        {chest.icon}
                      </div>

                      <h4 className="font-black text-sm text-[#3d312a]">{chest.name}</h4>
                      <p className="text-[10px] text-[#7a7065] font-medium leading-tight mt-1 px-1">
                        {chest.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#3d312a]/10 space-y-2">
                      <div className="text-xs font-black text-[#db5641] flex items-center justify-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{chest.price} Coins</span>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => handleOpenChest(chest)}
                        className={`w-full py-2 px-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md ${
                          canAfford
                            ? 'bg-[#db5641] hover:bg-[#c24a37] text-white active:scale-95 cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Chest</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rarity Drop Rates Breakdown */}
            <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl mt-2">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">Standard Chest Drop Rates</h5>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                <div className="bg-stone-200 text-stone-700 p-1.5 rounded-xl">Common (50%)</div>
                <div className="bg-blue-100 text-blue-800 p-1.5 rounded-xl">Rare (32%)</div>
                <div className="bg-amber-100 text-amber-900 p-1.5 rounded-xl">Legendary (14%)</div>
                <div className="bg-purple-100 text-purple-900 p-1.5 rounded-xl">Mythical (4%)</div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MY LOCKER / COLLECTION INVENTORY */}
        {/* ================================================================= */}
        {activeTab === 'locker' && (
          <div className="space-y-3 h-[330px] overflow-y-auto pr-1">
            {/* Locker Sub-switch & Filters */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-[#efe6d4]/40 p-2.5 rounded-2xl border border-[#3d312a]/10">
              <div className="flex bg-[#efe6d4] p-0.5 rounded-xl text-xs font-bold border border-[#3d312a]/5">
                <button
                  onClick={() => setLockerType('balls')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    lockerType === 'balls' ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm' : 'text-[#7a7065]'
                  }`}
                >
                  ⚽ Balls ({ownedBallsCount})
                </button>
                <button
                  onClick={() => setLockerType('trails')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    lockerType === 'trails' ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm' : 'text-[#7a7065]'
                  }`}
                >
                  ✨ Trails ({ownedTrailsCount})
                </button>
              </div>

              {/* Rarity filter tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-black scrollbar-none">
                {(['all', 'common', 'rare', 'legendary', 'mythical'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(r)}
                    className={`px-2 py-1 rounded-lg uppercase transition-all ${
                      selectedRarity === r 
                        ? 'bg-[#db5641] text-white' 
                        : 'bg-white text-[#7a7065] border border-[#3d312a]/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Balls in Locker */}
            {lockerType === 'balls' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filterList(BALLS_STORE_ITEMS.filter(b => unlockedBallIds.includes(b.id))).map((item) => {
                  const isEquipped = item.id === equippedBallId;
                  const rarityCfg = RARITIES[item.rarity];

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isEquipped 
                          ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-md' 
                          : 'bg-white border-[#3d312a]/10 text-[#3d312a]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="shrink-0">{renderBallPreview(item)}</div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md border ${rarityCfg.badgeBg}`}>
                            {rarityCfg.name}
                          </span>
                          <h4 className="font-extrabold text-xs truncate mt-0.5">{item.name}</h4>
                        </div>
                      </div>

                      {isEquipped ? (
                        <span className="text-[#6ca750] text-[10px] font-black flex items-center gap-1 bg-[#6ca750]/15 px-2.5 py-1 rounded-full shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" /> Equipped
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEquipBallClick(item.id)}
                          className="bg-[#efe6d4] hover:bg-[#3d312a] hover:text-[#faf6ee] text-[#3d312a] text-[10px] font-black px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0"
                        >
                          Equip
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Trails in Locker */}
            {lockerType === 'trails' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filterList(TRAILS_STORE_ITEMS.filter(t => unlockedTrailIds.includes(t.id))).map((item) => {
                  const isEquipped = item.id === equippedTrailId;
                  const rarityCfg = RARITIES[item.rarity];

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                        isEquipped 
                          ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-md' 
                          : 'bg-white border-[#3d312a]/10 text-[#3d312a]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md border ${rarityCfg.badgeBg}`}>
                            {rarityCfg.name}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs truncate mb-1">{item.name}</h4>
                        {renderTrailPreview(item)}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-[#3d312a]/10 flex items-center justify-end">
                        {isEquipped ? (
                          <span className="text-[#6ca750] text-[10px] font-black flex items-center gap-1 bg-[#6ca750]/15 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" /> Active Trail
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquipTrailClick(item.id)}
                            className="bg-[#efe6d4] hover:bg-[#3d312a] hover:text-[#faf6ee] text-[#3d312a] text-[10px] font-black px-3 py-1.5 rounded-full transition-all cursor-pointer"
                          >
                            Equip
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: COMPLETE 200 ITEM CATALOG & RARITY SHOWCASE */}
        {/* ================================================================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-3 h-[330px] overflow-y-auto pr-1">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-[#efe6d4]/40 p-2.5 rounded-2xl border border-[#3d312a]/10">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 100 balls & 100 trails..."
                    className="w-full bg-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#3d312a]/10 outline-none focus:border-[#db5641]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-black">
                {(['all', 'common', 'rare', 'legendary', 'mythical'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRarity(r)}
                    className={`px-2 py-1 rounded-lg uppercase transition-all ${
                      selectedRarity === r 
                        ? 'bg-[#db5641] text-white' 
                        : 'bg-white text-[#7a7065] border border-[#3d312a]/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filterList([...BALLS_STORE_ITEMS]).map((item) => {
                const isOwned = unlockedBallIds.includes(item.id);
                const rarityCfg = RARITIES[item.rarity];

                return (
                  <div 
                    key={item.id}
                    className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
                      isOwned ? 'bg-white border-[#3d312a]/15 shadow-sm' : 'bg-stone-100 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border ${rarityCfg.badgeBg}`}>
                        {rarityCfg.name}
                      </span>
                      {isOwned ? (
                        <Check className="w-3 h-3 text-[#6ca750]" />
                      ) : (
                        <span className="text-[8px] text-stone-400 font-bold">🔒 Locked</span>
                      )}
                    </div>
                    <div className="mx-auto my-1">{renderBallPreview(item, 'w-9 h-9')}</div>
                    <h5 className="font-extrabold text-[10px] truncate text-center mt-1">{item.name}</h5>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* UNBOXING ANIMATION MODAL */}
      {/* ================================================================= */}
      {isUnboxing && unboxedResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#faf6ee] text-[#3d312a] border border-[#3d312a]/20 rounded-3xl p-6 max-w-md w-full text-center relative shadow-2xl overflow-hidden">
            {unboxingStage === 'shaking' ? (
              <div className="py-8 space-y-4">
                <div className="text-6xl animate-bounce" style={{ animationDuration: '0.4s' }}>
                  {unboxedResult.chest.icon}
                </div>
                <h3 className="text-xl font-black text-[#3d312a] animate-pulse">Unboxing {unboxedResult.chest.name}...</h3>
                <p className="text-xs text-[#7a7065] font-semibold">Tuning quantum rarity flux...</p>
              </div>
            ) : (
              <div className="space-y-4 py-2 animate-in zoom-in-90 duration-300">
                <div className="inline-flex items-center gap-1 bg-[#6ca750]/15 text-[#6ca750] text-xs font-black px-3 py-1 rounded-full uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Unbox Success!
                </div>

                <div className="space-y-3">
                  {unboxedResult.balls.map(({ item, isNew, refund }) => {
                    const rarityCfg = RARITIES[item.rarity];
                    return (
                      <div key={item.id} className="bg-white border border-[#3d312a]/15 p-4 rounded-2xl shadow-md flex flex-col items-center">
                        <div className="my-2">{renderBallPreview(item, 'w-16 h-16')}</div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${rarityCfg.badgeBg}`}>
                          {rarityCfg.name} Ball
                        </span>
                        <h4 className="text-base font-black mt-1 text-[#3d312a]">{item.name}</h4>
                        <p className="text-xs text-[#7a7065] mt-0.5">{item.description}</p>
                        
                        {isNew ? (
                          <span className="text-xs font-black text-[#6ca750] bg-[#6ca750]/10 px-3 py-1 rounded-full mt-2">
                            ✨ NEW UNLOCKED!
                          </span>
                        ) : (
                          <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full mt-2">
                            Duplicate! +{refund} Coins Cashback Refunded!
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {unboxedResult.trails.map(({ item, isNew, refund }) => {
                    const rarityCfg = RARITIES[item.rarity];
                    return (
                      <div key={item.id} className="bg-white border border-[#3d312a]/15 p-4 rounded-2xl shadow-md flex flex-col items-center">
                        <div className="w-full my-2">{renderTrailPreview(item)}</div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${rarityCfg.badgeBg}`}>
                          {rarityCfg.name} Trail
                        </span>
                        <h4 className="text-base font-black mt-1 text-[#3d312a]">{item.name}</h4>
                        
                        {isNew ? (
                          <span className="text-xs font-black text-[#6ca750] bg-[#6ca750]/10 px-3 py-1 rounded-full mt-2">
                            ✨ NEW UNLOCKED!
                          </span>
                        ) : (
                          <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full mt-2">
                            Duplicate! +{refund} Coins Cashback Refunded!
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setIsUnboxing(false)}
                  className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer mt-2"
                >
                  Collect & Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ================================================================= */}
      {/* PLAYER CHECK / CLAIM GIFTS MODAL */}
      {/* ================================================================= */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#faf6ee] text-[#3d312a] border border-[#3d312a]/20 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowClaimModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-200 text-[#3d312a]/70 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 border border-amber-300 rounded-2xl text-amber-800 shadow-sm">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#3d312a]">Check Granted Gifts</h3>
                <p className="text-xs text-[#7a7065] font-semibold">Enter your account name or email to claim gifts from Martin.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase text-[#7a7065] mb-1 block">Your Account Name or Email</label>
                <input
                  type="text"
                  value={claimLookupInput}
                  onChange={(e) => setClaimLookupInput(e.target.value)}
                  placeholder={user?.email || user?.displayName || 'e.g. golfer_pro or player@sgs.edu.co'}
                  className="w-full bg-white border-2 border-[#3d312a]/15 focus:border-[#db5641] rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none shadow-inner"
                />
              </div>

              {claimFeedback && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 ${
                  claimFeedback.success 
                    ? 'bg-[#6ca750]/15 text-[#2d521d] border border-[#6ca750]/30' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {claimFeedback.success ? <CheckCircle className="w-4 h-4 text-[#6ca750] shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <span>{claimFeedback.message}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoadingGrants}
                  onClick={() => handleCheckClaimGifts()}
                  className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-3 rounded-2xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoadingGrants ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  <span>Claim Granted Exclusives</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
