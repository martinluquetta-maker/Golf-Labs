/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameCanvas from './components/GameCanvas';
import { LEVELS } from './levels';
import { GameState } from './types';
import { getCaddyCommentary } from './services/geminiService';
import { ENABLE_AI_CADDY, ENABLE_DEV_TOOLS } from './constants';
import { Loader2, RotateCcw, FastForward, Edit, Menu } from 'lucide-react';
import { CloseIcon } from './components/Icons';
import Footer from './components/Footer';
import useAudio from "./hooks/useAudio";
import { getPath } from "./utils/path";
import InfoDialog from './components/builds/infoDialog.tsx';
import { GameMenu } from './components/GameMenu';
import { calculateCoinsEarned } from './components/BallStoreData';
import { 
  getFirebaseServices, 
  authenticateWithGoogle, 
  logOutFromGoogle, 
  loadUserProfile, 
  saveUserProfile 
} from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('golf_lab_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
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
          unlockedBallIds: parsed.unlockedBallIds ?? ['classic_white'],
          equippedBallId: parsed.equippedBallId ?? 'classic_white',
        };
      }
    } catch (e) {
      console.error("Error reading localStorage", e);
    }
    return {
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

  const currentLevel = LEVELS[gameState.currentLevelIndex];
  const totalPar = LEVELS.reduce((acc, l) => acc + l.par, 0);

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
              const cloudProgress = await loadUserProfile(currentUser.uid);
              if (cloudProgress) {
                // Synthesize local and cloud progress
                setGameState(prev => ({
                  ...prev,
                  currentLevelIndex: cloudProgress.currentLevelIndex ?? prev.currentLevelIndex,
                  totalScore: cloudProgress.totalScore ?? prev.totalScore,
                  points: cloudProgress.points ?? prev.points,
                  bestScores: cloudProgress.bestScores ?? prev.bestScores,
                  resetUnlocked: cloudProgress.resetUnlocked ?? prev.resetUnlocked,
                  coins: cloudProgress.coins ?? prev.coins,
                  unlockedBallIds: cloudProgress.unlockedBallIds ?? prev.unlockedBallIds,
                  equippedBallId: cloudProgress.equippedBallId ?? prev.equippedBallId,
                }));
              } else {
                // Populate new signups with current local state
                await saveUserProfile(currentUser.uid, {
                  currentLevelIndex: gameState.currentLevelIndex,
                  totalScore: gameState.totalScore,
                  points: gameState.points,
                  bestScores: gameState.bestScores,
                  resetUnlocked: gameState.resetUnlocked,
                  coins: gameState.coins ?? 100,
                  unlockedBallIds: gameState.unlockedBallIds ?? ['classic_white'],
                  equippedBallId: gameState.equippedBallId ?? 'classic_white',
                });
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
  }, []);

  // Sync to database debounced on gameState changes
  useEffect(() => {
    if (!firebaseConfigured || !user) return;

    const syncToDatabase = async () => {
      setSyncStatus('syncing');
      try {
        await saveUserProfile(user.uid, {
          currentLevelIndex: gameState.currentLevelIndex,
          totalScore: gameState.totalScore,
          points: gameState.points,
          bestScores: gameState.bestScores,
          resetUnlocked: gameState.resetUnlocked,
          coins: gameState.coins ?? 100,
          unlockedBallIds: gameState.unlockedBallIds ?? ['classic_white'],
          equippedBallId: gameState.equippedBallId ?? 'classic_white',
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
  ]);

  const handleLogin = async () => {
    try {
      setSyncStatus('syncing');
      const loggedUser = await authenticateWithGoogle();
      setUser(loggedUser);
      setSyncStatus('synced');
    } catch (err) {
      console.error("Authentication login flow error:", err);
      setSyncStatus('offline');
    }
  };

  const handleLogout = async () => {
    try {
      await logOutFromGoogle();
      setUser(null);
    } catch (err) {
      console.error("Authentication logout flow error:", err);
    }
  };

  // Keep localStorage as a resilient offline-first fallback
  useEffect(() => {
    try {
      localStorage.setItem('golf_lab_state', JSON.stringify({
        currentLevelIndex: gameState.currentLevelIndex,
        totalScore: gameState.totalScore,
        points: gameState.points,
        bestScores: gameState.bestScores,
        resetUnlocked: gameState.resetUnlocked,
        coins: gameState.coins ?? 100,
        unlockedBallIds: gameState.unlockedBallIds ?? ['classic_white'],
        equippedBallId: gameState.equippedBallId ?? 'classic_white',
      }));
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
  }, [
    gameState.currentLevelIndex,
    gameState.totalScore,
    gameState.points,
    gameState.bestScores,
    gameState.resetUnlocked,
    gameState.coins,
    gameState.unlockedBallIds,
    gameState.equippedBallId
  ]);

  const totalBestDiffInfo = useMemo(() => {
    let totalDiff = 0;
    let playedCount = 0;
    LEVELS.forEach((level, index) => {
      const best = gameState.bestScores[index];
      if (best !== undefined) {
        totalDiff += (best - level.par);
        playedCount++;
      }
    });
    const diffString = playedCount === 0 ? "—" : (totalDiff === 0 ? "Par" : (totalDiff > 0 ? `+${totalDiff}` : totalDiff.toString()));
    return { totalDiff, diffString, playedCount };
  }, [gameState.bestScores]);

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
    setGameState(prev => ({
      ...prev,
      strokes: prev.strokes + 1,
      state: 'MOVING'
    }));
  };

  const handleHole = useCallback(() => {
    const finalStrokes = gameState.strokes;
    const currentLvlIndex = gameState.currentLevelIndex;
    const currentLvlPar = currentLevel.par;
    const currentLvlName = currentLevel.name;
    const isFinalHole = currentLvlIndex >= LEVELS.length - 1;

    // Transition immediately without setTimeout delay
    setGameState(prev => {
        const newBestScores = { ...prev.bestScores };
        const currentBest = newBestScores[currentLvlIndex];
        if (currentBest === undefined || finalStrokes < currentBest) {
          newBestScores[currentLvlIndex] = finalStrokes;
        }

        const bonus = (currentLvlPar - finalStrokes) * 200;
        const holePoints = Math.max(50, 500 + bonus);

        const earnedCoins = calculateCoinsEarned(finalStrokes, currentLvlPar);
        const previousCoins = prev.coins ?? 100;

        return { 
          ...prev, 
          state: isFinalHole ? 'GAME_OVER' : 'LEVEL_COMPLETE', 
          commentaryLoading: aiCaddyEnabled,
          lastCommentary: null,
          points: prev.points + holePoints,
          bestScores: newBestScores,
          coins: previousCoins + earnedCoins,
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

    if (gameState.currentLevelIndex >= LEVELS.length - 1) {
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
        points: 0,
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
      if (currentCoins < price) return prev;
      const currentUnlocked = prev.unlockedBallIds ?? ['classic_white'];
      return {
        ...prev,
        coins: currentCoins - price,
        unlockedBallIds: [...currentUnlocked, id],
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
        const isFinal = gameState.currentLevelIndex >= LEVELS.length - 1;
        
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
              state: 'AIMING',
              lastCommentary: null,
              commentaryLoading: false
            }));
            setShowMainMenu(false);
          }}
          bestScores={gameState.bestScores}
          aiCaddyEnabled={aiCaddyEnabled}
          onToggleAiCaddy={() => setAiCaddyEnabled(prev => !prev)}
          currentLevelIndex={gameState.currentLevelIndex}
          coins={gameState.coins ?? 100}
          unlockedBallIds={gameState.unlockedBallIds ?? ['classic_white']}
          equippedBallId={gameState.equippedBallId ?? 'classic_white'}
          onBuyBall={handleBuyBall}
          onEquipBall={handleEquipBall}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          firebaseConfigured={firebaseConfigured}
          syncStatus={syncStatus}
        />
      )}

      <InfoDialog title="Can you get a hole in one?" goal="Line up your shot and take a swing! Watch out for obstacles and get helpful hints from your personal caddy." onClose={() => {}} />
    </div>
    <div className="fixed bottom-4 left-0 right-0 flex items-center justify-center px-4 z-100">
      <Footer
        gameState={gameState}
        par={currentLevel.par}
        numLevels={LEVELS.length}
        mulligan={mulligan}
      />
    </div>
    </>
  );
};

export default App;
