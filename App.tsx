/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameCanvas from './components/GameCanvas';
import { LEVELS, CYBER_LEVELS } from './levels';
import { GameState } from './types';
import { getCaddyCommentary } from './services/geminiService';
import { ENABLE_AI_CADDY, ENABLE_DEV_TOOLS } from './constants';
import { Loader2, RotateCcw, FastForward, Edit, Menu, Smartphone } from 'lucide-react';
import { CloseIcon } from './components/Icons';
import Footer from './components/Footer';
import useAudio from "./hooks/useAudio";
import { getPath } from "./utils/path";
import InfoDialog from './components/builds/infoDialog.tsx';
import { GameMenu } from './components/GameMenu';
import { calculateCoinsEarned, ALL_BALL_IDS, ALL_TRAIL_IDS } from './components/BallStoreData';
import { 
  getFirebaseServices, 
  authenticateWithGoogle, 
  authenticateWithEmail,
  registerWithEmail,
  sendPasswordReset,
  logOutFromGoogle, 
  loadUserProfile, 
  saveUserProfile,
  checkMatchingGrants,
  checkUserBanStatus,
  PlayerBanRecord
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      // Look for ball and trail purchases in long-term offline storage
      let unlockedBallIds = ['classic_white'];
      let equippedBallId = 'classic_white';
      let unlockedTrailIds = ['trail_dust_white'];
      let equippedTrailId = 'trail_dust_white';
      
      const savedBalls = window.localStorage.getItem('golf_lab_balls');
      if (savedBalls) {
        const parsedBalls = JSON.parse(savedBalls);
        if (parsedBalls.unlockedBallIds) unlockedBallIds = parsedBalls.unlockedBallIds;
        if (parsedBalls.equippedBallId) equippedBallId = parsedBalls.equippedBallId;
      }

      const savedTrails = window.localStorage.getItem('golf_lab_trails');
      if (savedTrails) {
        const parsedTrails = JSON.parse(savedTrails);
        if (parsedTrails.unlockedTrailIds) unlockedTrailIds = parsedTrails.unlockedTrailIds;
        if (parsedTrails.equippedTrailId) equippedTrailId = parsedTrails.equippedTrailId;
      }
      
      const saved = sessionStorage.getItem('golf_lab_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        let initialWorld = parsed.currentWorld ?? 'classic';
        if (initialWorld === 'cyber') {
          const scores = parsed.bestScores ?? {};
          const currentIdx = parsed.currentLevelIndex ?? 0;
          const completedClassicLevel19 = scores[18] !== undefined;
          const completedClassicLevel20 = scores[19] !== undefined;
          const completedAnyLaterClassic = Object.keys(scores).some(k => {
            const idx = parseInt(k, 10);
            return idx >= 19 && idx < 100;
          });
          const reachedLevel20Classic = currentIdx >= 19;
          const unlocked = completedClassicLevel19 || completedClassicLevel20 || completedAnyLaterClassic || reachedLevel20Classic;
          if (!unlocked) {
            initialWorld = 'classic';
          }
        }
        return {
          currentWorld: initialWorld,
          currentLevelIndex: parsed.currentLevelIndex ?? 0,
          strokes: 0,
          totalScore: parsed.totalScore ?? 0,
          points: parsed.points ?? 0,
          state: 'AIMING',
          lastCommentary: null,
          commentaryLoading: false,
          bestScores: parsed.bestScores ?? {},
          resetUnlocked: parsed.resetUnlocked ?? false,
          coins: parsed.coins ?? 100,
          unlockedBallIds,
          equippedBallId,
          unlockedTrailIds,
          equippedTrailId,
          holeInOneStreak: parsed.holeInOneStreak ?? 0,
        };
      }
      
      return {
        currentWorld: 'classic',
        currentLevelIndex: 0,
        strokes: 0,
        totalScore: 0,
        points: 0,
        state: 'AIMING',
        lastCommentary: null,
        commentaryLoading: false,
        bestScores: {},
        resetUnlocked: false,
        coins: 100,
        unlockedBallIds,
        equippedBallId,
        unlockedTrailIds,
        equippedTrailId,
        holeInOneStreak: 0,
      };
    } catch (e) {
      console.error("Error reading storage", e);
    }
    return {
      currentWorld: 'classic',
      currentLevelIndex: 0,
      strokes: 0,
      totalScore: 0,
      points: 0,
      state: 'AIMING',
      lastCommentary: null,
      commentaryLoading: false,
      bestScores: {},
      resetUnlocked: false,
      coins: 100,
      unlockedBallIds: ['classic_white'],
      equippedBallId: 'classic_white',
      unlockedTrailIds: ['trail_dust_white'],
      equippedTrailId: 'trail_dust_white',
      holeInOneStreak: 0,
    };
  });
  
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [aiCaddyEnabled, setAiCaddyEnabled] = useState(ENABLE_AI_CADDY);
  const [retryCount, setRetryCount] = useState(0);
  const [nextLevelLoading, setNextLevelLoading] = useState(false);
  const [caddyDismissed, setCaddyDismissed] = useState(false);

  // Firebase auth & sync states
  const [user, setUser] = useState<any>(null);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'pending'>('pending');
  const [authError, setAuthError] = useState<{ code: string; message: string; domain?: string } | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  // Moderation / Ban status
  const [banStatus, setBanStatus] = useState<{
    isBanned: boolean;
    banRecord?: PlayerBanRecord;
    timeLeftFormatted?: string;
  }>({ isBanned: false });
  const [isCheckingBan, setIsCheckingBan] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const activeLevels = useMemo(() => (gameState.currentWorld === 'cyber' ? CYBER_LEVELS : LEVELS), [gameState.currentWorld]);
  const currentLevel = activeLevels[gameState.currentLevelIndex] || activeLevels[0] || LEVELS[0];
  const totalPar = activeLevels.reduce((acc, l) => acc + l.par, 0);

  const isMartinUser = useCallback((u: any) => {
    if (!u) return false;
    const email = (u.email || '').toLowerCase().trim();
    const name = (u.displayName || '').toLowerCase().trim();
    return email === 'martin.luquetta@sgs.edu.co' || name === 'martin' || email.startsWith('martin.luquetta');
  }, []);

  // Check ban status periodically and on user change
  const verifyBan = useCallback(async () => {
    if (isMartinUser(user)) {
      setBanStatus({ isBanned: false });
      return;
    }
    try {
      const status = await checkUserBanStatus(
        user?.email,
        user?.displayName,
        user?.uid
      );
      setBanStatus(status);
    } catch (e) {
      console.warn("Ban check failed:", e);
    }
  }, [user, isMartinUser]);

  useEffect(() => {
    verifyBan();
    const timer = setInterval(verifyBan, 4000);
    return () => clearInterval(timer);
  }, [verifyBan]);

  const isCyberUnlocked = useMemo(() => {
    if (isMartinUser(user)) {
      return true;
    }
    const scores = gameState.bestScores || {};
    const completedClassicLevel19 = scores[18] !== undefined;
    const completedClassicLevel20 = scores[19] !== undefined;
    const completedAnyLaterClassic = Object.keys(scores).some(k => {
      const idx = parseInt(k, 10);
      return idx >= 19 && idx < 100;
    });
    const reachedLevel20Classic = gameState.currentWorld === 'classic' && gameState.currentLevelIndex >= 19;
    
    return completedClassicLevel19 || completedClassicLevel20 || completedAnyLaterClassic || reachedLevel20Classic;
  }, [gameState.bestScores, gameState.currentWorld, gameState.currentLevelIndex, user, isMartinUser]);

  const { playForeground, preloadCache } = useAudio();

  const audioFiles = [
    getPath("/media/audio/sfx/global/lose.mp3"),
    getPath("/media/audio/sfx/global/win.mp3"),
    getPath("/media/audio/sfx/global/buttonclick.mp3"),
    getPath("/media/audio/sfx/minigolf/goal.mp3"),
    getPath("/media/audio/sfx/minigolf/hitwall.mp3"),
    getPath("/media/audio/sfx/minigolf/intohole.mp3"),
    getPath("/media/audio/sfx/minigolf/outofholehole.mp3"),
    getPath("/media/audio/sfx/minigolf/putt.mp3"),
  ];

  useEffect(() => {
    preloadCache(audioFiles);
  }, []);

  // Developer & VIP Account Perks: Unlock ALL 100 balls, 100 trails, unlimited coins, and all levels
  useEffect(() => {
    if (isMartinUser(user)) {
      const cheatedCompleted: Record<number, number> = {};
      activeLevels.forEach((_, index) => {
        const key = gameState.currentWorld === 'cyber' ? 100 + index : index;
        cheatedCompleted[key] = 1; // 1 stroke (hole in one)
      });
  
      setGameState(prev => ({
        ...prev,
        // We use 9 quadrillion because standard safe JavaScript integers max out at ~9.007 quadrillion
        coins: Math.max(prev.coins || 0, 9000000000000000),
        unlockedBallIds: ALL_BALL_IDS,
        unlockedTrailIds: ALL_TRAIL_IDS,
        bestScores: { ...prev.bestScores, ...cheatedCompleted }
      }));
    }
  }, [user, activeLevels, gameState.currentWorld, isMartinUser]);

  // Firebase Init & Auth state hooks
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initAndListen = async () => {
      const { auth, configured } = await getFirebaseServices();
      setFirebaseConfigured(configured);
      
      if (configured && auth) {
        setSyncStatus('synced');
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            setSyncStatus('syncing');
            try {
              const isMartin = isMartinUser(currentUser);
              const cloudProgress = await loadUserProfile(currentUser.uid);
              
              // Check if Martin Luquetta granted any exclusive sets to this player's email or displayName
              const grantCheck = await checkMatchingGrants(
                currentUser.email,
                currentUser.displayName,
                currentUser.email
              );
              const grantedBalls = grantCheck.ballIds;
              const grantedTrails = grantCheck.trailIds;

              if (cloudProgress) {
                // Synthesize local, cloud, and granted progress
                setGameState(prev => {
                  const localBalls = prev.unlockedBallIds || ['classic_white'];
                  const cloudBalls = cloudProgress.unlockedBallIds || [];
                  const mergedBalls = isMartin ? ALL_BALL_IDS : Array.from(new Set([...localBalls, ...cloudBalls, ...grantedBalls]));
                  
                  const localTrails = prev.unlockedTrailIds || ['trail_dust_white'];
                  const cloudTrails = cloudProgress.unlockedTrailIds || [];
                  const mergedTrails = isMartin ? ALL_TRAIL_IDS : Array.from(new Set([...localTrails, ...cloudTrails, ...grantedTrails]));

                  return {
                    ...prev,
                    currentLevelIndex: Math.max(cloudProgress.currentLevelIndex ?? 0, prev.currentLevelIndex ?? 0),
                    totalScore: cloudProgress.totalScore ?? prev.totalScore,
                    points: Math.max(cloudProgress.points ?? 0, prev.points ?? 0),
                    bestScores: { ...(prev.bestScores || {}), ...(cloudProgress.bestScores || {}) },
                    resetUnlocked: cloudProgress.resetUnlocked || prev.resetUnlocked,
                    coins: isMartin ? Math.max(cloudProgress.coins ?? 100, prev.coins ?? 100, 9000000000000000) : Math.max(cloudProgress.coins ?? 100, prev.coins ?? 100),
                    unlockedBallIds: mergedBalls,
                    equippedBallId: cloudProgress.equippedBallId ?? prev.equippedBallId ?? 'classic_white',
                    unlockedTrailIds: mergedTrails,
                    equippedTrailId: cloudProgress.equippedTrailId ?? prev.equippedTrailId ?? 'trail_dust_white',
                  };
                });
              } else {
                // Populate new signups with current local state and any granted items
                const initialBalls = isMartin ? ALL_BALL_IDS : Array.from(new Set([...(gameState.unlockedBallIds ?? ['classic_white']), ...grantedBalls]));
                const initialTrails = isMartin ? ALL_TRAIL_IDS : Array.from(new Set([...(gameState.unlockedTrailIds ?? ['trail_dust_white']), ...grantedTrails]));
                
                await saveUserProfile(currentUser.uid, {
                  currentLevelIndex: gameState.currentLevelIndex,
                  totalScore: gameState.totalScore,
                  points: gameState.points,
                  bestScores: gameState.bestScores,
                  resetUnlocked: gameState.resetUnlocked,
                  coins: isMartin ? 9000000000000000 : (gameState.coins ?? 100),
                  unlockedBallIds: initialBalls,
                  equippedBallId: gameState.equippedBallId ?? 'classic_white',
                  unlockedTrailIds: initialTrails,
                  equippedTrailId: gameState.equippedTrailId ?? 'trail_dust_white',
                });
                setGameState(prev => ({
                  ...prev,
                  unlockedBallIds: initialBalls,
                  unlockedTrailIds: initialTrails,
                }));
              }
              setSyncStatus('synced');
            } catch (err) {
              console.error("Cloud synchronization load error:", err);
              setSyncStatus('offline');
            }
          } else {
            setSyncStatus('synced');
          }
        });
      } else {
        setSyncStatus('offline');
      }
    };

    initAndListen();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isMartinUser]);

  // Sync to database debounced on gameState changes
  useEffect(() => {
    if (!firebaseConfigured || !user) return;

    const syncToDatabase = async () => {
      setSyncStatus('syncing');
      try {
        const isMartin = isMartinUser(user);
        await saveUserProfile(user.uid, {
          currentLevelIndex: gameState.currentLevelIndex,
          totalScore: gameState.totalScore,
          points: gameState.points,
          bestScores: gameState.bestScores,
          resetUnlocked: gameState.resetUnlocked,
          coins: isMartin ? 9000000000000000 : (gameState.coins ?? 100),
          unlockedBallIds: isMartin ? ALL_BALL_IDS : (gameState.unlockedBallIds ?? ['classic_white']),
          equippedBallId: gameState.equippedBallId ?? 'classic_white',
          unlockedTrailIds: isMartin ? ALL_TRAIL_IDS : (gameState.unlockedTrailIds ?? ['trail_dust_white']),
          equippedTrailId: gameState.equippedTrailId ?? 'trail_dust_white',
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error("Cloud synchronization save error:", err);
        setSyncStatus('offline');
      }
    };

    const timer = setTimeout(syncToDatabase, 600);
    return () => clearTimeout(timer);
  }, [
    user,
    firebaseConfigured,
    gameState.currentLevelIndex,
    gameState.totalScore,
    gameState.points,
    gameState.bestScores,
    gameState.resetUnlocked,
    gameState.coins,
    gameState.unlockedBallIds,
    gameState.equippedBallId,
    gameState.unlockedTrailIds,
    gameState.equippedTrailId,
    isMartinUser,
  ]);

  const handleLogin = async () => {
    try {
      setSyncStatus('syncing');
      setAuthError(null);
      const loggedUser = await authenticateWithGoogle();
      setUser(loggedUser);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error("Authentication login flow error:", err);
      setSyncStatus('offline');
      setAuthError({
        code: err?.code || 'auth/popup-failed',
        message: err?.message || 'The authentication popup closed or failed. This usually happens if the domain is not authorized in your Firebase console, or if third-party popups are blocked by your browser.'
      });
    }
  };

  const handleLoginEmail = async (email: string, pass: string) => {
    try {
      setSyncStatus('syncing');
      setAuthError(null);
      const loggedUser = await authenticateWithEmail(email, pass);
      setUser(loggedUser);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error("Email authentication login error:", err);
      setSyncStatus('offline');
      let msg = err?.message || 'Failed to sign in with email.';
      if (err?.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password authentication is not yet enabled in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password.';
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password. Please check your credentials or create a new account.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setAuthError({
        code: err?.code || 'auth/email-failed',
        message: msg
      });
      throw err;
    }
  };

  const handleSignUpEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      setSyncStatus('syncing');
      setAuthError(null);
      const loggedUser = await registerWithEmail(email, pass, displayName);
      setUser(loggedUser);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error("Email registration error:", err);
      setSyncStatus('offline');
      let msg = err?.message || 'Failed to create account with email.';
      if (err?.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password authentication is not yet enabled in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'An account already exists with this email address. Please sign in instead.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setAuthError({
        code: err?.code || 'auth/signup-failed',
        message: msg
      });
      throw err;
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setAuthError(null);
      await sendPasswordReset(email);
    } catch (err: any) {
      console.error("Password reset error:", err);
      let msg = err?.message || 'Failed to send password reset email.';
      if (err?.code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setAuthError({
        code: err?.code || 'auth/reset-failed',
        message: msg
      });
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logOutFromGoogle();
      setUser(null);
      // Reset game state when logging out to prevent cross-account leak
      setGameState({
        currentLevelIndex: 0,
        strokes: 0,
        totalScore: 0,
        points: 0,
        state: 'AIMING',
        lastCommentary: null,
        commentaryLoading: false,
        bestScores: {},
        resetUnlocked: false,
        coins: 100,
        unlockedBallIds: ['classic_white'],
        equippedBallId: 'classic_white',
      });
      sessionStorage.removeItem('golf_lab_state');
    } catch (err) {
      console.error("Authentication logout flow error:", err);
    }
  };

  // Keep sessionStorage as a resilient offline-first fallback for current tab session
  useEffect(() => {
    try {
      // Save game progress to tab session only
      sessionStorage.setItem('golf_lab_state', JSON.stringify({
        currentWorld: gameState.currentWorld,
        currentLevelIndex: gameState.currentLevelIndex,
        totalScore: gameState.totalScore,
        points: gameState.points,
        bestScores: gameState.bestScores,
        resetUnlocked: gameState.resetUnlocked,
        coins: gameState.coins ?? 100,
        holeInOneStreak: gameState.holeInOneStreak ?? 0,
      }));
      
      // Save purchased and equipped balls to long-term local storage so skins persist across devices/refreshes
      window.localStorage.setItem('golf_lab_balls', JSON.stringify({
        unlockedBallIds: gameState.unlockedBallIds ?? ['classic_white'],
        equippedBallId: gameState.equippedBallId ?? 'classic_white',
      }));

      // Save purchased and equipped trails to long-term storage
      window.localStorage.setItem('golf_lab_trails', JSON.stringify({
        unlockedTrailIds: gameState.unlockedTrailIds ?? ['trail_dust_white'],
        equippedTrailId: gameState.equippedTrailId ?? 'trail_dust_white',
      }));
    } catch (e) {
      console.error("Error writing to storage", e);
    }
  }, [
    gameState.currentWorld,
    gameState.currentLevelIndex,
    gameState.totalScore,
    gameState.points,
    gameState.bestScores,
    gameState.resetUnlocked,
    gameState.coins,
    gameState.unlockedBallIds,
    gameState.equippedBallId,
    gameState.unlockedTrailIds,
    gameState.equippedTrailId,
    gameState.holeInOneStreak
  ]);

  const totalBestDiffInfo = useMemo(() => {
    let totalDiff = 0;
    let playedCount = 0;
    activeLevels.forEach((level, index) => {
      const bestKey = gameState.currentWorld === 'cyber' ? 100 + index : index;
      const best = gameState.bestScores[bestKey];
      if (best !== undefined) {
        totalDiff += (best - level.par);
        playedCount++;
      }
    });
    const diffString = playedCount === 0 ? "—" : (totalDiff === 0 ? "Par" : (totalDiff > 0 ? `+${totalDiff}` : totalDiff.toString()));
    return { totalDiff, diffString, playedCount };
  }, [gameState.bestScores, activeLevels, gameState.currentWorld]);

  // Handle Intro Commentary
  useEffect(() => {
    if (!aiCaddyEnabled || gameState.state !== 'AIMING' || gameState.lastCommentary !== null) return;

    const loadIntro = async () => {
       setGameState(prev => ({ ...prev, commentaryLoading: true }));
       try {
         const text = await getCaddyCommentary(currentLevel.name, 0, currentLevel.par, 'START');
         setGameState(prev => ({ ...prev, lastCommentary: text, commentaryLoading: false }));
       } catch (e) {
         setGameState(prev => ({ ...prev, commentaryLoading: false }));
       }
    };
    loadIntro();
  }, [gameState.currentLevelIndex, gameState.state, aiCaddyEnabled, currentLevel]);

  useEffect(() => {
    setCaddyDismissed(false);
  }, [gameState.currentLevelIndex, retryCount]); 

  const handleStroke = () => {
    setGameState(prev => {
      const nextStrokes = prev.strokes + 1;
      const nextStreak = nextStrokes > 1 ? 0 : (prev.holeInOneStreak ?? 0);
      return {
        ...prev,
        strokes: nextStrokes,
        holeInOneStreak: nextStreak,
        state: 'MOVING'
      };
    });
  };

  const handleHole = useCallback(() => {
    const finalStrokes = gameState.strokes;
    const currentLvlIndex = gameState.currentLevelIndex;
    const currentLvlPar = currentLevel.par;
    const currentLvlName = currentLevel.name;
    const isFinalHole = currentLvlIndex >= activeLevels.length - 1;

    // Transition immediately without setTimeout delay
    setGameState(prev => {
        const newBestScores = { ...prev.bestScores };
        const bestKey = prev.currentWorld === 'cyber' ? 100 + currentLvlIndex : currentLvlIndex;
        const currentBest = newBestScores[bestKey];
        if (currentBest === undefined || finalStrokes < currentBest) {
          newBestScores[bestKey] = finalStrokes;
        }

        const bonus = (currentLvlPar - finalStrokes) * 200;
        const holePoints = Math.max(50, 500 + bonus);

        const earnedCoins = calculateCoinsEarned(finalStrokes, currentLvlPar);
        const previousCoins = prev.coins ?? 100;

        const isHoleInOne = finalStrokes === 1;
        const nextStreak = isHoleInOne ? (prev.holeInOneStreak ?? 0) + 1 : 0;

        return { 
          ...prev, 
          state: isFinalHole ? 'GAME_OVER' : 'LEVEL_COMPLETE', 
          commentaryLoading: aiCaddyEnabled,
          lastCommentary: null,
          points: prev.points + holePoints,
          bestScores: newBestScores,
          coins: previousCoins + earnedCoins,
          holeInOneStreak: nextStreak,
          // If it's final hole, add to total now so screen reflects it
          totalScore: isFinalHole ? prev.totalScore + finalStrokes : prev.totalScore,
          resetUnlocked: isFinalHole ? true : prev.resetUnlocked
        };
    });

    playForeground(getPath("/media/audio/sfx/minigolf/goal.mp3"));

    // Async fetch commentary in background so modal shows up instantly
    if (aiCaddyEnabled) {
        getCaddyCommentary(currentLvlName, finalStrokes, currentLvlPar, 'WIN', isFinalHole)
          .then(commentary => {
            setGameState(prev => ({
              ...prev,
              lastCommentary: commentary,
              commentaryLoading: false
            }));
          })
          .catch(() => {
            setGameState(prev => ({ ...prev, commentaryLoading: false }));
          });
    }
  }, [currentLevel, gameState.strokes, gameState.currentLevelIndex, playForeground]);

  const nextLevel = async () => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));

    if (gameState.currentLevelIndex >= activeLevels.length - 1) {
        setGameState(prev => ({ 
            ...prev, 
            state: 'GAME_OVER',
            totalScore: prev.totalScore + prev.strokes,
            resetUnlocked: true
        }));
        return;
    }

    setNextLevelLoading(true);
    const nextIndex = gameState.currentLevelIndex + 1;
    
    setGameState(prev => ({
        ...prev,
        currentLevelIndex: nextIndex,
        totalScore: prev.totalScore + prev.strokes,
        strokes: 0,
        state: 'AIMING',
        lastCommentary: null,
        commentaryLoading: false
    }));
    
    setNextLevelLoading(false);
  };

  const resetGame = async () => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    setGameState(prev => ({
        ...prev,
        currentLevelIndex: 0,
        strokes: 0,
        totalScore: 0,
        holeInOneStreak: 0,
        state: 'AIMING',
        lastCommentary: null,
        commentaryLoading: false
    }));
    setRetryCount(0);
  };

  const retryLevel = () => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    setGameState(prev => ({
        ...prev,
        strokes: 0,
        holeInOneStreak: 0,
        state: 'AIMING',
        lastCommentary: null,
        commentaryLoading: false
    }));
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    if (gameState.state === 'GAME_OVER') {
      playForeground(getPath("/media/audio/sfx/global/win.mp3"));
    }
  }, [gameState.state, playForeground]);

  const mulligan = () => {
    playForeground(getPath("/media/audio/sfx/global/lose.mp3"));
    setGameState(prev => ({
      ...prev,
      strokes: Math.max(0, prev.strokes - 1), 
      state: 'AIMING',
      lastCommentary: null,
      commentaryLoading: false
    }));
    setRetryCount(prev => prev + 1);
  };

  const handleBuyBall = useCallback((id: string, price: number) => {
    setGameState(prev => {
      const currentCoins = prev.coins ?? 100;
      if (price > 0 && currentCoins < price) return prev;
      const currentUnlocked = prev.unlockedBallIds ?? ['classic_white'];
      return {
        ...prev,
        coins: Math.max(0, currentCoins - price),
        unlockedBallIds: currentUnlocked.includes(id) ? currentUnlocked : [...currentUnlocked, id],
        equippedBallId: id,
      };
    });
  }, []);

  const handleEquipBall = useCallback((id: string) => {
    setGameState(prev => {
      const currentUnlocked = prev.unlockedBallIds ?? ['classic_white'];
      if (!currentUnlocked.includes(id)) return prev;
      return {
        ...prev,
        equippedBallId: id,
      };
    });
  }, []);

  const handleBuyTrail = useCallback((id: string, price: number) => {
    setGameState(prev => {
      const currentCoins = prev.coins ?? 100;
      if (price > 0 && currentCoins < price) return prev;
      const currentUnlocked = prev.unlockedTrailIds ?? ['trail_dust_white'];
      return {
        ...prev,
        coins: Math.max(0, currentCoins - price),
        unlockedTrailIds: currentUnlocked.includes(id) ? currentUnlocked : [...currentUnlocked, id],
        equippedTrailId: id,
      };
    });
  }, []);

  const handleEquipTrail = useCallback((id: string) => {
    setGameState(prev => {
      const currentUnlocked = prev.unlockedTrailIds ?? ['trail_dust_white'];
      if (!currentUnlocked.includes(id)) return prev;
      return {
        ...prev,
        equippedTrailId: id,
      };
    });
  }, []);

  const handleAddCoins = useCallback((amount: number) => {
    setGameState(prev => ({
      ...prev,
      coins: Math.max(0, (prev.coins ?? 100) + amount),
    }));
  }, []);

  const handleUnlockItems = useCallback((ballIds: string[], trailIds: string[]) => {
    setGameState(prev => {
      const currentBalls = prev.unlockedBallIds ?? ['classic_white'];
      const currentTrails = prev.unlockedTrailIds ?? ['trail_dust_white'];
      const newBalls = Array.from(new Set([...currentBalls, ...ballIds]));
      const newTrails = Array.from(new Set([...currentTrails, ...trailIds]));
      return {
        ...prev,
        unlockedBallIds: newBalls,
        unlockedTrailIds: newTrails,
        equippedBallId: ballIds.length > 0 ? ballIds[0] : prev.equippedBallId,
        equippedTrailId: trailIds.length > 0 ? trailIds[0] : prev.equippedTrailId,
      };
    });
  }, []);

  const handleUnlockAllLevels = useCallback(() => {
    setGameState(prev => {
      const scores: Record<number, number> = { ...prev.bestScores };
      for (let i = 0; i < 60; i++) {
        if (scores[i] === undefined) scores[i] = 1;
      }
      for (let i = 100; i < 120; i++) {
        if (scores[i] === undefined) scores[i] = 1;
      }
      return {
        ...prev,
        bestScores: scores,
      };
    });
  }, []);

  const renderHUD = () => {
    return (
      <div className="h-full w-full relative">
        {aiCaddyEnabled && !caddyDismissed && (
            <div className="absolute bottom-[200px] lg:bottom-[120px] left-1/2 -translate-x-1/2 z-40 w-full max-w-md select-none px-4">
            <div className="bg-[#faf6ee] border border-[#3d312a]/15 p-4 rounded-3xl shadow-xl flex items-center gap-4 relative pointer-events-auto">
                <div className="flex flex-col text-center justify-center items-center gap-1.5 mx-auto pr-6">
                    <span className="text-sm text-[#7a7065] font-medium uppercase tracking-wider">Caddy analysis</span>
                    {gameState.commentaryLoading ? (
                      <Loader2 className="animate-spin text-[#3d312a] w-5 h-5 mt-1" />
                    ) : (
                      <p className="text-base font-medium text-[#3d312a] text-pretty">
                        "{gameState.lastCommentary || "Line up your shot..."}"
                      </p>
                    )}
                </div>
                <button
                  onClick={() => setCaddyDismissed(true)}
                  className="absolute top-3 right-3 p-1 hover:bg-[#3d312a]/10 rounded-full transition-colors"
                  aria-label="Dismiss caddy message"
                >
                  <CloseIcon className="w-5 h-5 text-[#3d312a]/60" />
                </button>
            </div>
            </div>
        )}
      </div>
    );
  };

  const renderOverlay = () => {
    if (gameState.state === 'LEVEL_COMPLETE') {
        const scoreInfo = getScoreTerm(gameState.strokes, currentLevel.par);
        const isFinal = gameState.currentLevelIndex >= activeLevels.length - 1;
        
        return (
            <div className="fixed inset-0 bg-[#3d312a]/50 flex items-center justify-center z-50 backdrop-blur-md p-[55px]">
                <div className="text-[#3d312a] px-[30px] lg:px-10 py-10 lg:py-[50px] rounded-3xl text-center w-full rainbow-border animate-rotate-gradient animate-in fade-in zoom-in duration-200 flex flex-col items-center min-w-xs max-w-md shadow-2xl">
                    <h2 className="text-[38px] lg:text-[44px] font-bold mb-4 leading-none tracking-tight text-[#3d312a]">Nice shot</h2>
                    
                    <div className="flex flex-col items-center mb-6">
                        <p className="text-lg tracking-tight font-bold leading-none flex gap-1.5 text-[#3d312a]">{gameState.strokes} {gameState.strokes !== 1 ? "Strokes" : "Stroke"}
                        {scoreInfo && (
                            <><span className="opacity-50">—</span><span className="text-[#db5641] font-semibold">{scoreInfo.term}</span></>
                        )}
                        </p>
                    </div>

                    {/* Coins Award Indicator Banner */}
                    <div className="bg-[#6ca750]/10 border border-[#6ca750]/35 rounded-2xl py-3 px-5 mb-6 flex items-center justify-center gap-2.5 animate-pulse select-none">
                      <span className="text-xl animate-bounce" style={{ animationDuration: '2s' }}>🪙</span>
                      <div className="text-left leading-none">
                        <span className="text-[9px] text-[#7a7065] font-extrabold uppercase tracking-wider block">Coins Reward Gained</span>
                        <span className="text-[15px] font-black text-[#6ca750] block mt-0.5">+{calculateCoinsEarned(gameState.strokes, currentLevel.par)} Gold Coins</span>
                      </div>
                    </div>

                    
                    {aiCaddyEnabled && (
                        <div className="bg-[#f0ebe0] p-5 rounded-2xl mb-8 gap-2 flex flex-col justify-center w-full min-h-[90px] border border-[#3d312a]/10">
                            <p className="text-sm text-[#7a7065] tracking-wider font-semibold uppercase">Caddy message</p>
                            {gameState.commentaryLoading ? (
                            <div className="flex justify-center py-2">
                                <Loader2 className="animate-spin text-[#3d312a]" />
                            </div>
                            ) : (
                            <p className="text-base font-medium text-[#3d312a] tracking-tight">"{gameState.lastCommentary || "Good job!"}"</p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                      <button 
                          onClick={nextLevel}
                          disabled={nextLevelLoading}
                          className="w-full bg-[#d96b43] text-white hover:opacity-90 leading-none py-[18px] px-[26px] min-w-[175px] lg:min-w-[206px] rounded-full font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
                      >
                          {nextLevelLoading ? (
                               <Loader2 className="animate-spin text-white" />
                          ) : (
                              isFinal ? <>View results</> : <>Next hole</>
                          )}
                      </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState.state === 'GAME_OVER') {
        const parDiff = gameState.totalScore - totalPar;
        const scoreText = parDiff === 0 ? "Even Par" : (parDiff > 0 ? `${parDiff} Over Par` : `${Math.abs(parDiff)} Under Par`);
        
        return (
          <div className="fixed inset-0 bg-[#3d312a]/50 flex items-center justify-center z-50 backdrop-blur-md p-[55px]">
            <div className="text-[#3d312a] px-[30px] lg:px-10 py-10 lg:py-[50px] rounded-3xl text-center w-full rainbow-border animate-rotate-gradient animate-in fade-in zoom-in duration-200 flex flex-col items-center min-w-xs max-w-md shadow-2xl">
                <h2 className="text-[38px] lg:text-[44px] font-bold mb-4 leading-none tracking-tight text-[#3d312a]">Course Complete</h2>
                
                <div className="flex flex-col items-center mb-6">
                    <p className="text-xl tracking-tight font-extrabold leading-none mb-2 text-[#db5641]">{scoreText}</p>
                    <p className="text-base text-[#7a7065] font-semibold">Total Strokes: {gameState.totalScore} (Par {totalPar})</p>
                </div>
                
                {aiCaddyEnabled && (
                    <div className="bg-[#f0ebe0] p-5 rounded-2xl mb-8 gap-2 flex flex-col justify-center w-full min-h-[90px] border border-[#3d312a]/10">
                        <p className="text-sm text-[#7a7065] tracking-wider font-semibold uppercase">Final analysis</p>
                        {gameState.commentaryLoading ? (
                            <div className="flex justify-center py-2">
                                <Loader2 className="animate-spin text-[#3d312a]" />
                            </div>
                        ) : (
                            <p className="text-base font-medium text-[#3d312a] tracking-tight">"{gameState.lastCommentary || "What a game!"}"</p>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                  <button 
                      onClick={resetGame}
                      className="w-full bg-[#3d312a] text-[#faf6ee] hover:opacity-90 leading-none py-[18px] px-[26px] min-w-[175px] lg:min-w-[206px] rounded-full font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
                  >
                      Play again
                  </button>
                </div>
            </div>
          </div>
        );
    }

    return null;
  };

  const getScoreTerm = (strokes: number, par: number) => {
    if (strokes === 1) return { term: "Hole-in-one", color: "text-black" };
    const diff = strokes - par;
    if (diff === -1) return { term: "Birdie", color: "text-black" };
    if (diff === 0) return { term: "Par", color: "text-black" };
    if (diff === 1) return { term: "Bogey", color: "text-black" };
    if (diff === 2) return { term: "Double bogey", color: "text-black" };
    return null;
  };

  if (isPortrait) {
    return (
      <div className="fixed inset-0 bg-[#3d312a] text-[#faf6ee] flex flex-col items-center justify-center p-8 z-50 text-center font-sans">
        <Smartphone className="w-20 h-20 mb-8 animate-pulse text-[#b19f8e]" style={{ transform: 'rotate(90deg)' }} />
        <h2 className="text-3xl font-black mb-4 tracking-tight">Rotate Your Device</h2>
        <p className="text-[#e2d8ce] max-w-sm text-lg leading-relaxed font-medium">
          Golf Lab is a physics sandbox designed for landscape displays. Please rotate your device horizontally to play.
        </p>
      </div>
    );
  }

  // Active Ban Lockout Screen
  if (banStatus.isBanned && !isMartinUser(user)) {
    return (
      <div className="fixed inset-0 bg-[#1c1815] text-[#faf6ee] flex flex-col items-center justify-center p-6 z-50 font-sans overflow-y-auto">
        <div className="max-w-md w-full bg-[#2a221d] border-2 border-red-500/50 rounded-3xl p-7 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl mx-auto flex items-center justify-center border border-red-500/40 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase bg-red-600/30 text-red-300 border border-red-500/40 px-3 py-0.5 rounded-full inline-block mb-1.5">
              Account Suspended
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">Access Restricted</h2>
            <p className="text-xs text-stone-300 font-semibold mt-1">
              Your account or player profile has been suspended by the game administrator.
            </p>
          </div>

          <div className="bg-[#1c1815] p-4 rounded-2xl border border-red-900/40 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-stone-400 font-bold">Target Account:</span>
              <span className="font-mono font-black text-amber-300 truncate max-w-[200px]">
                {user?.email || user?.displayName || banStatus.banRecord?.targetIdentifier}
              </span>
            </div>
            <div className="flex justify-between items-start pb-2 border-b border-stone-800">
              <span className="text-stone-400 font-bold">Reason:</span>
              <span className="font-semibold text-stone-200 text-right max-w-[220px]">
                {banStatus.banRecord?.reason || 'Policy Violation'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-800">
              <span className="text-stone-400 font-bold">Duration:</span>
              <span className="font-bold text-stone-300">
                {banStatus.banRecord?.durationLabel || 'Custom'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-400 font-bold">Time Remaining:</span>
              <span className="font-mono font-black text-red-400">
                {banStatus.timeLeftFormatted || 'Permanent'}
              </span>
            </div>
            {banStatus.banRecord?.note && (
              <div className="pt-2 text-[11px] text-stone-400 italic border-t border-stone-800">
                Admin Note: {banStatus.banRecord.note}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                setIsCheckingBan(true);
                await verifyBan();
                setIsCheckingBan(false);
              }}
              className="w-full bg-[#db5641] hover:bg-[#c44733] text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {isCheckingBan ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span>Check Ban Status & Re-enter</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Sign Out / Switch Account
              </button>
            )}
          </div>

          <p className="text-[10px] text-stone-500">
            Suspensions are issued directly by Martin Luquetta. If you believe this is an error, contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full h-[calc(100%-100px)] bg-[#3d312a] font-sans overflow-hidden relative rounded-2xl">
      {renderHUD()}

      <GameCanvas 
          key={`${currentLevel.id}-${retryCount}`}
          level={currentLevel}
          onStroke={handleStroke}
          onHole={handleHole}
          equippedBallId={gameState.equippedBallId ?? 'classic_white'}
          equippedTrailId={gameState.equippedTrailId ?? 'trail_dust_white'}
          strokes={gameState.strokes}
      />
      
      {/* Floating Main Menu Button (Top-Right) */}
      <button 
        type="button"
        onClick={() => {
          playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
          setShowMainMenu(true);
        }}
        className="absolute top-4 right-4 z-40 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg bg-[#faf6ee]/90 text-[#3d312a] border border-[#3d312a]/20 hover:bg-[#faf6ee] flex items-center gap-1.5 pointer-events-auto"
      >
        <Menu className="w-3.5 h-3.5" /> <span>Menu</span>
      </button>

      {renderOverlay()}

      {showMainMenu && (
        <GameMenu
          onStartGame={(levelIndex) => {
            setGameState(prev => ({
              ...prev,
              currentLevelIndex: levelIndex,
              strokes: 0,
              holeInOneStreak: 0,
              state: 'AIMING',
              lastCommentary: null,
              commentaryLoading: false
            }));
            setShowMainMenu(false);
          }}
          currentWorld={gameState.currentWorld || 'classic'}
          onSelectWorld={(world) => {
            if (world === 'cyber' && !isCyberUnlocked) return;
            setGameState(prev => ({
              ...prev,
              currentWorld: world,
              currentLevelIndex: 0,
              strokes: 0,
              holeInOneStreak: 0,
              state: 'AIMING'
            }));
          }}
          isCyberUnlocked={isCyberUnlocked}
          bestScores={gameState.bestScores}
          aiCaddyEnabled={aiCaddyEnabled}
          onToggleAiCaddy={() => setAiCaddyEnabled(prev => !prev)}
          currentLevelIndex={gameState.currentLevelIndex}
          coins={gameState.coins ?? 100}
          unlockedBallIds={gameState.unlockedBallIds ?? ['classic_white']}
          equippedBallId={gameState.equippedBallId ?? 'classic_white'}
          unlockedTrailIds={gameState.unlockedTrailIds ?? ['trail_dust_white']}
          equippedTrailId={gameState.equippedTrailId ?? 'trail_dust_white'}
          onBuyBall={handleBuyBall}
          onEquipBall={handleEquipBall}
          onBuyTrail={handleBuyTrail}
          onEquipTrail={handleEquipTrail}
          onAddCoins={handleAddCoins}
          onUnlockItems={handleUnlockItems}
          user={user}
          onLogin={handleLogin}
          onLoginEmail={handleLoginEmail}
          onRegisterEmail={handleSignUpEmail}
          onResetPassword={handleResetPassword}
          onLogout={handleLogout}
          firebaseConfigured={firebaseConfigured}
          syncStatus={syncStatus}
          authError={authError}
          onClearAuthError={() => setAuthError(null)}
          onUnlockAllLevels={handleUnlockAllLevels}
        />
      )}

      <InfoDialog title="Can you get a hole in one?" goal="Line up your shot and take a swing! Watch out for obstacles and get helpful hints from your personal caddy." onClose={() => {}} />
    </div>
    <div className="fixed bottom-4 left-0 right-0 flex items-center justify-center px-4 z-100">
      <Footer
        gameState={gameState}
        par={currentLevel.par}
        numLevels={activeLevels.length}
        mulligan={mulligan}
      />
    </div>
    </>
  );
};

export default App;
