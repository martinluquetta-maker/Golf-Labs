/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BallItem, BALLS_STORE_ITEMS } from './BallStoreData';
import { Coins, CheckCircle, Lock, ShoppingBag, Sparkles, Star } from 'lucide-react';
import useAudio from '../hooks/useAudio';
import { getPath } from '../utils/path';

interface BallStoreViewProps {
  coins: number;
  unlockedBallIds: string[];
  equippedBallId: string;
  onBuyBall: (id: string, price: number) => void;
  onEquipBall: (id: string) => void;
}

export const BallStoreView: React.FC<BallStoreViewProps> = ({
  coins,
  unlockedBallIds,
  equippedBallId,
  onBuyBall,
  onEquipBall,
}) => {
  const { playForeground } = useAudio();

  const handleBuy = (item: BallItem) => {
    if (coins >= item.price) {
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
      onBuyBall(item.id, item.price);
    } else {
      playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
    }
  };

  const handleEquip = (id: string) => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    onEquipBall(id);
  };

  // Render high-fidelity CSS previews of the golf ball styles matching the canvas representation
  const renderBallPreview = (item: BallItem) => {
    const isEquipped = item.id === equippedBallId;

    if (item.isGoldMetallic) {
      return (
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-[#ffd700]/30 animate-pulse"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #fff9b5 0%, #ffd700 50%, #b58900 100%)',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.6), inset 0 -4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Sparkles className="w-4 h-4 text-white text-yellow-100 opacity-90 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      );
    }

    if (item.is8Ball) {
      return (
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-black"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #4a4a4a 0%, #1a1a1a 60%, #000000 100%)',
            boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.5)',
          }}
        >
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-black text-xs font-mono">
            8
          </div>
        </div>
      );
    }

    if (item.isFireball) {
      return (
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #ffff7a 0%, #ff5d00 50%, #9e0000 100%)',
            boxShadow: '0 0 18px rgba(255, 69, 0, 0.8), inset 0 -3px 6px rgba(0,0,0,0.4)',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-300 via-orange-500 to-transparent opacity-60 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 -translate-x-2 -translate-y-2"></div>
        </div>
      );
    }

    if (item.isSlime) {
      return (
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #b2ff59 0%, #39ff14 60%, #1c9e03 100%)',
            boxShadow: '0 0 12px rgba(57, 255, 20, 0.5), inset 0 -4px 6px rgba(0,0,0,0.2)',
          }}
        >
          <div className="absolute inset-x-2 bottom-1.5 h-2 bg-white/30 rounded-full blur-[1px]"></div>
          <div className="w-2 h-2 rounded-full bg-white/70 -translate-x-2 -translate-y-2"></div>
        </div>
      );
    }

    if (item.isDonut) {
      return (
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-amber-900/30"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #ffd0e8 0%, #ffb5d8 60%, #e070a8 100%)',
            boxShadow: 'inset 0 -4px 6px rgba(138, 79, 29, 0.3)',
          }}
        >
          {/* Donut hole indicator */}
          <div className="absolute w-4 h-4 rounded-full bg-[#faf6ee] z-10 border border-amber-900/15 shadow-inner"></div>
          {/* Sprinkles representation */}
          <div className="absolute top-2 left-3 w-1.5 h-0.5 bg-blue-400 rounded-full rotate-45"></div>
          <div className="absolute top-2 right-4 w-1.5 h-0.5 bg-yellow-400 rounded-full -rotate-45"></div>
          <div className="absolute bottom-3 left-4 w-1.5 h-0.5 bg-purple-400 rounded-full rotate-12"></div>
          <div className="absolute bottom-2.5 right-3 w-1.5 h-0.5 bg-green-400 rounded-full -rotate-12"></div>
        </div>
      );
    }

    if (item.isCosmic) {
      return (
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-indigo-900"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #5d1182 0%, #0d0221 70%, #030008 100%)',
            boxShadow: '0 0 16px rgba(138, 43, 226, 0.7), inset 0 -4px 8px rgba(0,0,0,0.6)',
          }}
        >
          {/* Twinkly stars represent */}
          <div className="absolute top-2 w-0.5 h-0.5 rounded-full bg-white animate-ping"></div>
          <div className="absolute bottom-3.5 right-3 w-1 h-1 bg-white rounded-full opacity-85"></div>
          <div className="absolute bottom-2 left-2.5 w-0.5 h-0.5 bg-indigo-200 rounded-full opacity-60"></div>
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full blur-[2px] -translate-x-1.5 -translate-y-1.5 animate-pulse"></div>
        </div>
      );
    }

    // Default real golf-ball styles rendering
    return (
      <div 
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-[#3d312a]/15"
        style={{
          background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${item.color} 50%, #afaba2 100%)`,
          boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.15)',
        }}
      >
        {/* Dimple textures subtle grid overlay */}
        <div className="absolute inset-2 grid grid-cols-4 gap-1 opacity-10 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-black/60"></div>
          ))}
        </div>

        {/* TP5 Dual rings alignment lines style */}
        {item.hasDualRing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full border border-[#e35112]/50"></div>
            <div className="w-9 h-9 rounded-full border border-black/40 absolute"></div>
          </div>
        )}

        {/* Star patterns or Truvis hexagonal red tags */}
        {item.hasTruvis && (
          <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
            <div className="w-3 h-3 bg-[#db5641] rotate-45 transform absolute -top-0.5"></div>
            <div className="w-2.5 h-2.5 bg-[#db5641] rotate-12 transform absolute -bottom-1"></div>
            <div className="w-2.5 h-2.5 bg-[#db5641] -rotate-12 transform absolute -left-1"></div>
            <div className="w-3 h-3 bg-[#db5641] -rotate-45 transform absolute -right-0.5"></div>
            <div className="w-3 h-3 bg-[#db5641] rounded-full absolute"></div>
          </div>
        )}

        {/* Black Practice range stripe lines */}
        {item.hasStripe && (
          <div 
            className="absolute h-1.5 w-full pointer-events-none rotate-[25deg]"
            style={{ backgroundColor: item.secondaryColor || '#1d1916' }}
          ></div>
        )}

        {/* Small Red Titleist 1 branding label */}
        {item.hasNumberOne && (
          <div className="absolute flex flex-col items-center pointer-events-none select-none leading-none -translate-y-0.5">
            <span className="text-[5px] text-[#3d312a] font-sans scale-75 tracking-tighter opacity-80">ProV1</span>
            <span className="text-[10px] text-[#db5641] font-black font-mono mt-[-2px]">1</span>
          </div>
        )}
      </div>
    );
  };

  const realBalls = BALLS_STORE_ITEMS.filter(b => b.type === 'real');
  const extraBalls = BALLS_STORE_ITEMS.filter(b => b.type === 'extra');

  const renderSection = (title: string, items: BallItem[]) => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-[#7a7065] tracking-wider uppercase flex items-center gap-1.5 px-1 border-b border-[#3d312a]/10 pb-1.5">
          {title}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => {
            const isUnlocked = unlockedBallIds.includes(item.id);
            const isEquipped = item.id === equippedBallId;
            const canAfford = coins >= item.price;

            return (
              <div 
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all pointer-events-auto select-none ${
                  isEquipped 
                    ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-md' 
                    : isUnlocked 
                    ? 'bg-white hover:bg-[#efe6d4]/30 border-[#3d312a]/10 text-[#3d312a]' 
                    : 'bg-white/50 border-[#3d312a]/10 opacity-90 text-[#3d312a]'
                }`}
              >
                {/* Visual Preview Ball render */}
                <div className="shrink-0 flex items-center justify-center">
                  {renderBallPreview(item)}
                </div>

                {/* Details layout */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm truncate leading-tight">
                      {item.name}
                    </h4>
                  </div>
                  <p className={`text-[11px] leading-snug mt-1 font-medium ${isEquipped ? 'text-[#faf6ee]/75' : 'text-[#7a7065]'}`}>
                    {item.description}
                  </p>
                </div>

                {/* Interaction Action Button */}
                <div className="shrink-0">
                  {isEquipped ? (
                    <div className="flex items-center gap-1 text-[#6ca750] px-2.5 py-1.5 rounded-full bg-[#6ca750]/15 font-black text-[10px] uppercase">
                      <CheckCircle className="w-3.5 h-3.5" /> Equipped
                    </div>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleEquip(item.id)}
                      className={`px-3.5 py-1.5 rounded-full font-extrabold text-xs transition-all cursor-pointer ${
                        isEquipped 
                          ? 'bg-transparent text-white' 
                          : 'bg-[#efe6d4] hover:bg-[#3d312a] hover:text-[#faf6ee] text-[#3d312a]'
                      }`}
                    >
                      Equip
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`px-3.5 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs transition-all shadow-sm ${
                        canAfford 
                          ? 'bg-[#db5641] hover:bg-[#c24a37] hover:scale-102 text-white cursor-pointer active:scale-98' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none border border-gray-400/20'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{item.price}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
      <div className="flex-1 overflow-visible">
        {/* Banner with Total Coins */}
        <div className="bg-[#efe6d4] border border-[#3d312a]/10 p-4 rounded-3xl mb-5 flex justify-between items-center relative overflow-hidden">
          {/* Subtle star particle backdrops */}
          <div className="absolute right-12 top-2 opacity-10 font-black text-8xl translate-y-3 shrink-0 transform pointer-events-none select-none">
            🪙
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[#db5641] text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" /> Golf Customization Store
            </div>
            <h2 className="text-xl font-black text-[#3d312a] mt-0.5">Customize Your Ball Skin</h2>
            <p className="text-[#7a7065] text-xs font-semibold leading-none mt-1">
              Complete holes to earn coins. Best par strokes grant major gold bonuses!
            </p>
          </div>

          <div className="bg-[#db5641] text-white px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-md border border-[#db5641]/20">
            <Coins className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
            <div className="flex flex-col text-right">
              <span className="text-[18px] font-black leading-none">{coins}</span>
              <span className="text-[8px] font-bold tracking-wider uppercase opacity-85 leading-none mt-0.5">Total Coins</span>
            </div>
          </div>
        </div>

        {/* Scrollable grid area splits */}
        <div className="space-y-6 h-[320px] overflow-y-auto pr-1">
          {renderSection('Professional Tour Real-Life Balls', realBalls)}
          {renderSection('Creative Sand & Physics Extras', extraBalls)}
        </div>
      </div>

      <div className="pt-4 text-center">
        <p className="text-xs text-[#7a7065] font-semibold flex items-center justify-center gap-1.5">
          👉 Equip your purchased ball in-game and see custom trajectories and high fidelity textures automatically!
        </p>
      </div>
    </div>
  );
};
