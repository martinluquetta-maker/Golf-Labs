/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Gift, 
  Mail, 
  User, 
  Send, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Coins, 
  Layers, 
  Award, 
  Terminal, 
  Cloud, 
  Search,
  Check,
  Flame,
  Key
} from 'lucide-react';
import { 
  createExclusiveGrant, 
  deleteExclusiveGrant, 
  fetchExclusiveGrants, 
  checkMatchingGrants,
  ExclusiveGrantRecord,
  saveUserProfile
} from '../services/firebase';
import { 
  BALLS_STORE_ITEMS, 
  TRAILS_STORE_ITEMS, 
  EXCLUSIVE_BALLS, 
  EXCLUSIVE_TRAILS 
} from './BallStoreData';
import useAudio from '../hooks/useAudio';
import { getPath } from '../utils/path';

interface ConsoleViewProps {
  user: any;
  coins: number;
  unlockedBallIds: string[];
  equippedBallId: string;
  unlockedTrailIds: string[];
  equippedTrailId: string;
  onBuyBall: (id: string, price: number) => void;
  onEquipBall: (id: string) => void;
  onBuyTrail: (id: string, price: number) => void;
  onEquipTrail: (id: string) => void;
  onAddCoins: (amount: number) => void;
  onUnlockItems: (ballIds: string[], trailIds: string[]) => void;
  bestScores?: Record<number, number>;
  onUnlockAllLevels?: () => void;
  onSetAllScoresHIO?: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  user,
  coins,
  unlockedBallIds,
  equippedBallId,
  unlockedTrailIds,
  equippedTrailId,
  onBuyBall,
  onEquipBall,
  onBuyTrail,
  onEquipTrail,
  onAddCoins,
  onUnlockItems,
  bestScores,
  onUnlockAllLevels,
  onSetAllScoresHIO,
}) => {
  const { playForeground } = useAudio();
  const [activeSubTab, setActiveSubTab] = useState<'gifting' | 'master_tools' | 'lookup' | 'telemetry'>('gifting');

  // Gifting State
  const [grantTargetInput, setGrantTargetInput] = useState('');
  const [grantTargetType, setGrantTargetType] = useState<'email' | 'account_name'>('email');
  const [grantSelectedSet, setGrantSelectedSet] = useState<'net' | 'scribble' | 'both'>('both');
  const [grantNote, setGrantNote] = useState('');
  const [grantFeedback, setGrantFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [grantsList, setGrantsList] = useState<ExclusiveGrantRecord[]>([]);
  const [isLoadingGrants, setIsLoadingGrants] = useState(false);
  const [selfActionFeedback, setSelfActionFeedback] = useState<string | null>(null);

  // Player Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    searched: boolean;
    matchedGrants: ExclusiveGrantRecord[];
    ballIds: string[];
    trailIds: string[];
  } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Custom Coin Input
  const [customCoinInput, setCustomCoinInput] = useState('1000000');

  // Load existing grants on mount
  useEffect(() => {
    loadGrants();
  }, []);

  const loadGrants = async () => {
    setIsLoadingGrants(true);
    try {
      const list = await fetchExclusiveGrants();
      setGrantsList(list);
    } catch (e) {
      console.error("Error loading grants in console:", e);
    } finally {
      setIsLoadingGrants(false);
    }
  };

  const showFeedback = (msg: string) => {
    setSelfActionFeedback(msg);
    setTimeout(() => setSelfActionFeedback(null), 3500);
  };

  // 1. Grant Exclusive Set to a Player
  const handleGrantToPlayer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTarget = grantTargetInput.trim();
    if (!cleanTarget) {
      setGrantFeedback({ success: false, message: 'Please enter a target account name or email address.' });
      return;
    }

    setIsLoadingGrants(true);
    let ballIds: string[] = [];
    let trailIds: string[] = [];
    let setName = '';

    if (grantSelectedSet === 'net') {
      ballIds = ['exclusive_net'];
      trailIds = ['exclusive_trail_net', 'trail_matrix_mesh'];
      setName = 'Exclusive Net Set';
    } else if (grantSelectedSet === 'scribble') {
      ballIds = ['exclusive_scribble'];
      trailIds = ['exclusive_trail_scribble', 'trail_scribble_ink'];
      setName = 'Exclusive Scribble Set';
    } else {
      ballIds = ['exclusive_net', 'exclusive_scribble'];
      trailIds = ['exclusive_trail_net', 'exclusive_trail_scribble', 'trail_matrix_mesh', 'trail_scribble_ink'];
      setName = 'Complete Creator Bundle (Net + Scribble)';
    }

    const result = await createExclusiveGrant(
      cleanTarget,
      grantTargetType,
      setName,
      ballIds,
      trailIds,
      grantNote,
      user?.email || 'martin.luquetta@sgs.edu.co'
    );

    setIsLoadingGrants(false);
    setGrantFeedback({ success: result.success, message: result.message });
    
    if (result.success) {
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
      setGrantTargetInput('');
      setGrantNote('');
      const updated = await fetchExclusiveGrants();
      setGrantsList(updated);
    } else {
      playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
    }
  };

  // 2. Revoke Grant
  const handleRevokeGrant = async (grantId?: string) => {
    if (!grantId) return;
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    await deleteExclusiveGrant(grantId);
    const updated = await fetchExclusiveGrants();
    setGrantsList(updated);
    showFeedback("Revoked grant from active records.");
  };

  // 3. Unlock and Equip Exclusives for Martin
  const handleUnlockSelfExclusives = () => {
    playForeground(getPath("/media/audio/sfx/global/win.mp3"));
    const exclusiveBallIds = ['exclusive_net', 'exclusive_scribble'];
    const exclusiveTrailIds = ['exclusive_trail_net', 'exclusive_trail_scribble', 'trail_matrix_mesh', 'trail_scribble_ink'];
    onUnlockItems(exclusiveBallIds, exclusiveTrailIds);
    exclusiveBallIds.forEach(bId => onBuyBall(bId, 0));
    exclusiveTrailIds.forEach(tId => onBuyTrail(tId, 0));
    onEquipBall('exclusive_net');
    onEquipTrail('exclusive_trail_net');
    showFeedback("✨ Net & Scribble sets unlocked and equipped to your account!");
  };

  // 4. Unlock All 102 Balls & Trails
  const handleUnlockAllVault = () => {
    playForeground(getPath("/media/audio/sfx/global/win.mp3"));
    const allBallIds = BALLS_STORE_ITEMS.map(b => b.id);
    const allTrailIds = TRAILS_STORE_ITEMS.map(t => t.id);
    onUnlockItems(allBallIds, allTrailIds);
    allBallIds.forEach(bId => onBuyBall(bId, 0));
    allTrailIds.forEach(tId => onBuyTrail(tId, 0));
    showFeedback("🎾 All 102 Balls and 102 Particle Trails unlocked!");
  };

  // 5. Inject Coins
  const handleInjectCoins = (amount: number) => {
    playForeground(getPath("/media/audio/sfx/global/win.mp3"));
    onAddCoins(amount);
    showFeedback(`🪙 Injected ${amount.toLocaleString()} Coins into balance!`);
  };

  // 6. Force Cloud Sync
  const handleForceCloudSync = async () => {
    if (!user?.uid) {
      showFeedback("⚠️ No active Google Auth UID detected. Sign in with Google to sync.");
      return;
    }
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    try {
      await saveUserProfile(user.uid, {
        coins,
        unlockedBallIds,
        equippedBallId,
        unlockedTrailIds,
        equippedTrailId,
        bestScores: bestScores || {},
        updatedAt: new Date().toISOString()
      });
      showFeedback("☁️ Cloud profile successfully synced to Firestore users collection!");
    } catch (e) {
      console.error(e);
      showFeedback("❌ Failed to push cloud profile. Check network/firestore.");
    }
  };

  // 7. Lookup User Grants
  const handlePerformLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = lookupQuery.trim();
    if (!query) return;

    setIsLookingUp(true);
    try {
      const res = await checkMatchingGrants(query, query, query);
      setLookupResult({
        searched: true,
        matchedGrants: res.matchedGrants,
        ballIds: res.ballIds,
        trailIds: res.trailIds
      });
    } catch (err) {
      console.error("Lookup error:", err);
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-[#3d312a] animate-in fade-in duration-200">
      {/* Top Banner: Master Identity */}
      <div className="bg-gradient-to-r from-stone-900 via-[#3d312a] to-stone-900 text-amber-300 p-4 rounded-2xl mb-4 border-2 border-amber-400/50 shadow-md flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-xl text-amber-950 shadow-md shrink-0">
            <Crown className="w-6 h-6 fill-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-300" /> Super Admin / Creator
              </span>
              <span className="text-xs font-mono font-bold text-stone-300">
                {user?.email || 'martin.luquetta@sgs.edu.co'}
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-wide mt-0.5">
              Martin Luquetta Master Console
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUnlockSelfExclusives}
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Equip Exclusives</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {selfActionFeedback && (
        <div className="mb-3 p-3 bg-[#6ca750]/20 border border-[#6ca750]/40 rounded-xl text-xs font-black text-[#224415] flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-[#6ca750] shrink-0" />
          <span>{selfActionFeedback}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex bg-[#efe6d4]/80 p-1 rounded-2xl border border-[#3d312a]/10 mb-4 gap-1 overflow-x-auto scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => setActiveSubTab('gifting')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'gifting'
              ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm'
              : 'text-[#7a7065] hover:bg-[#faf6ee]/50'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Player Gifting</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('master_tools')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'master_tools'
              ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm'
              : 'text-[#7a7065] hover:bg-[#faf6ee]/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Master Tools</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('lookup')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'lookup'
              ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm'
              : 'text-[#7a7065] hover:bg-[#faf6ee]/50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Player Lookup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('telemetry')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'telemetry'
              ? 'bg-[#3d312a] text-[#faf6ee] shadow-sm'
              : 'text-[#7a7065] hover:bg-[#faf6ee]/50'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Diagnostics</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* SUBTAB 1: PLAYER GIFTING & DISTRIBUTION */}
        {activeSubTab === 'gifting' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Grant Form Card */}
            <form onSubmit={handleGrantToPlayer} className="bg-white border border-[#3d312a]/15 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-[#3d312a] flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#db5641]" /> Grant Exclusive Sets Directly to a Player
                  </h3>
                  <p className="text-xs text-[#7a7065] font-semibold">
                    The player will automatically receive the items upon logging in or checking gifts.
                  </p>
                </div>

                {/* Target Type Selector */}
                <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setGrantTargetType('email')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                      grantTargetType === 'email' ? 'bg-[#3d312a] text-white shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantTargetType('account_name')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                      grantTargetType === 'account_name' ? 'bg-[#3d312a] text-white shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Account Name</span>
                  </button>
                </div>
              </div>

              {/* Input Target */}
              <div>
                <label className="text-[11px] font-black uppercase text-[#7a7065] mb-1 block">
                  {grantTargetType === 'email' ? 'Target Email Address' : 'Target Account / Display Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    {grantTargetType === 'email' ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <input
                    type={grantTargetType === 'email' ? 'email' : 'text'}
                    value={grantTargetInput}
                    onChange={(e) => setGrantTargetInput(e.target.value)}
                    placeholder={grantTargetType === 'email' ? 'e.g. friend@sgs.edu.co or player@gmail.com' : 'e.g. GolferPro99 or Tiger'}
                    className="w-full bg-stone-50 border-2 border-stone-200 focus:border-[#db5641] rounded-xl pl-10 pr-3 py-2 text-xs font-semibold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Set Selection Cards */}
              <div>
                <label className="text-[11px] font-black uppercase text-[#7a7065] mb-1.5 block">Select Exclusive Package</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGrantSelectedSet('net')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      grantSelectedSet === 'net' 
                        ? 'bg-cyan-50 border-cyan-500 shadow-sm ring-2 ring-cyan-400/40' 
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-xs font-black text-cyan-900 uppercase flex items-center gap-1">
                      <span>🌐</span> Exclusive Net Set
                    </div>
                    <div className="text-[10px] text-[#7a7065] font-semibold mt-0.5">Net Ball + Matrix Mesh Trail</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGrantSelectedSet('scribble')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      grantSelectedSet === 'scribble' 
                        ? 'bg-rose-50 border-rose-500 shadow-sm ring-2 ring-rose-400/40' 
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-xs font-black text-rose-900 uppercase flex items-center gap-1">
                      <span>🎨</span> Exclusive Scribble Set
                    </div>
                    <div className="text-[10px] text-[#7a7065] font-semibold mt-0.5">Scribble Ball + Ink Trail</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGrantSelectedSet('both')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      grantSelectedSet === 'both' 
                        ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-400/40' 
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="text-xs font-black text-amber-900 uppercase flex items-center gap-1">
                      <span>👑</span> Both Sets (Full Vault)
                    </div>
                    <div className="text-[10px] text-[#7a7065] font-semibold mt-0.5">Complete Creator Bundle</div>
                  </button>
                </div>
              </div>

              {/* Creator Note */}
              <div>
                <input
                  type="text"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="Optional Creator Gift Note (e.g. Gifted for tournament championship!)"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>

              {/* Feedback */}
              {grantFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  grantFeedback.success 
                    ? 'bg-[#6ca750]/15 text-[#2d521d] border border-[#6ca750]/30' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {grantFeedback.success ? <CheckCircle className="w-4 h-4 text-[#6ca750] shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{grantFeedback.message}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoadingGrants}
                className="w-full bg-[#db5641] hover:bg-[#c24a37] text-white py-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoadingGrants ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Grant Exclusive Package to Player</span>
              </button>
            </form>

            {/* Active Grants List Card */}
            <div className="bg-white border border-[#3d312a]/15 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#3d312a] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#6ca750]" /> Active Granted Players ({grantsList.length})
                </h3>
                <button
                  type="button"
                  onClick={loadGrants}
                  className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGrants ? 'animate-spin' : ''}`} />
                  <span>Refresh List</span>
                </button>
              </div>

              {grantsList.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs font-semibold border-2 border-dashed border-stone-200 rounded-xl">
                  No player grants recorded yet. Use the form above to grant exclusive sets.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {grantsList.map((grant) => (
                    <div 
                      key={grant.id || `${grant.targetIdentifier}_${grant.setName}`}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3 hover:bg-stone-100/70 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-stone-500">
                            {grant.targetType === 'email' ? '📧' : '👤'}
                          </span>
                          <span className="font-mono font-black text-xs text-stone-900 truncate">
                            {grant.targetIdentifier}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {grant.targetType}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#db5641] mt-0.5">
                          {grant.setName}
                        </div>
                        {grant.note && (
                          <div className="text-[10px] text-stone-500 italic mt-0.5">
                            "{grant.note}"
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokeGrant(grant.id)}
                        title="Revoke Grant"
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: MASTER DEVELOPER TOOLS */}
        {activeSubTab === 'master_tools' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Quick Unlocks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Unlock All Vault */}
              <div className="bg-white border border-[#3d312a]/15 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-600 font-black text-sm mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Complete Cosmetics Vault</span>
                  </div>
                  <p className="text-xs text-[#7a7065] font-medium leading-relaxed">
                    Instantly unlock all 102 balls and 102 trails across all rarities (Common, Rare, Legendary, Mythical, Exclusive).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUnlockAllVault}
                  className="mt-3 w-full bg-[#3d312a] hover:bg-[#2a221d] text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Unlock All 102 Balls & Trails</span>
                </button>
              </div>

              {/* Unlock All Holes / Scores */}
              <div className="bg-white border border-[#3d312a]/15 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#db5641] font-black text-sm mb-1">
                    <Award className="w-4 h-4" />
                    <span>Hole Progression & Mastery</span>
                  </div>
                  <p className="text-xs text-[#7a7065] font-medium leading-relaxed">
                    Instantly unlock access to all 60 Classic holes and 20 Cyber holes for instant playthrough.
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUnlockAllLevels) onUnlockAllLevels();
                      showFeedback("⛳ All 60 Classic & 20 Cyber holes unlocked!");
                    }}
                    className="flex-1 bg-[#db5641] hover:bg-[#c24a37] text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Unlock All Holes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Coin Injector Card */}
            <div className="bg-white border border-[#3d312a]/15 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-[#3d312a]">
                  <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Master Coin Injector</span>
                </div>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Current: {coins.toLocaleString()} Coins
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleInjectCoins(10000)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-900 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  +10,000 Coins
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectCoins(100000)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-900 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  +100,000 Coins
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectCoins(9000000000000000)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-stone-950 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  Max (Infinite)
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="number"
                  value={customCoinInput}
                  onChange={(e) => setCustomCoinInput(e.target.value)}
                  placeholder="Custom Coin Amount"
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(customCoinInput, 10);
                    if (!isNaN(parsed) && parsed > 0) handleInjectCoins(parsed);
                  }}
                  className="bg-[#3d312a] hover:bg-[#2a221d] text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Inject Custom
                </button>
              </div>
            </div>

            {/* Cloud Push Sync */}
            <div className="bg-white border border-[#3d312a]/15 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-[#3d312a] flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-600" /> Force Firestore Cloud Profile Push
                </h4>
                <p className="text-xs text-[#7a7065] font-medium mt-0.5">
                  Persists your unlocked items, scores, and coins directly into Firestore `users/{user?.uid}`.
                </p>
              </div>
              <button
                type="button"
                onClick={handleForceCloudSync}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-sm"
              >
                Force Cloud Push
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB 3: PLAYER LOOKUP */}
        {activeSubTab === 'lookup' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <form onSubmit={handlePerformLookup} className="bg-white border border-[#3d312a]/15 p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#3d312a] flex items-center gap-1.5">
                <Search className="w-4 h-4 text-stone-500" /> Inspect Player Grants & Entitlements
              </h3>
              <p className="text-xs text-[#7a7065] font-medium">
                Enter any player email or account name to check if they have received exclusive grants.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. friend@sgs.edu.co or GolferPro99"
                  className="flex-1 bg-stone-50 border-2 border-stone-200 focus:border-[#db5641] rounded-xl px-4 py-2 text-xs font-semibold outline-none"
                />
                <button
                  type="submit"
                  disabled={isLookingUp}
                  className="bg-[#3d312a] hover:bg-[#2a221d] text-white px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLookingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Inspect</span>
                </button>
              </div>
            </form>

            {lookupResult && lookupResult.searched && (
              <div className="bg-white border border-[#3d312a]/15 p-5 rounded-2xl shadow-sm space-y-3 animate-in fade-in">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#3d312a]">
                  Lookup Result for "{lookupQuery}"
                </h4>

                {lookupResult.matchedGrants.length === 0 ? (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 text-center">
                    No active grants found for "{lookupQuery}". This user currently has standard store access only.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-[#6ca750]/10 border border-[#6ca750]/30 rounded-xl text-xs text-[#2d521d]">
                      <strong className="block font-black mb-1">
                        ✅ {lookupResult.matchedGrants.length} Active Grant(s) Found:
                      </strong>
                      <ul className="list-disc list-inside space-y-1">
                        {lookupResult.matchedGrants.map(g => (
                          <li key={g.id || g.setName}>
                            <strong>{g.setName}</strong> ({g.targetType}: {g.targetIdentifier})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs font-bold text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <div>Unlocked Balls: <span className="font-mono text-stone-900">{lookupResult.ballIds.join(', ')}</span></div>
                      <div className="mt-1">Unlocked Trails: <span className="font-mono text-stone-900">{lookupResult.trailIds.join(', ')}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 4: DIAGNOSTICS & TELEMETRY */}
        {activeSubTab === 'telemetry' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-[#3d312a]/15 p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#3d312a] flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-sky-600" /> Firebase & System Telemetry
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">User Email</span>
                  <span className="font-mono font-black text-stone-900">{user?.email || 'martin.luquetta@sgs.edu.co'}</span>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Auth UID</span>
                  <span className="font-mono font-black text-stone-900 truncate block">{user?.uid || 'Local / Master Session'}</span>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Active Grants in Memory</span>
                  <span className="font-mono font-black text-stone-900">{grantsList.length} Grants</span>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">Role Enforcement</span>
                  <span className="font-mono font-black text-[#6ca750]">SUPER_ADMIN_CREATOR (Exclusive)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
