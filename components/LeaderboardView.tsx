import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../services/firebase';

interface LeaderboardViewProps {
  firebaseConfigured: boolean;
  currentUserUid: string | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ firebaseConfigured, currentUserUid }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      if (firebaseConfigured) {
        const data = await getLeaderboard(50);
        if (mounted) {
          setLeaderboard(data);
        }
      }
      if (mounted) {
        setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => { mounted = false; };
  }, [firebaseConfigured]);

  if (!firebaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#3d312a]/5 rounded-3xl border border-[#3d312a]/10 max-w-md mx-auto mt-8 text-center">
        <Trophy className="w-12 h-12 text-[#3d312a]/30 mb-4" />
        <h3 className="text-lg font-bold text-[#3d312a] mb-2">Cloud Sandbox Restricted</h3>
        <p className="text-sm text-[#7a7065] font-medium leading-relaxed">
          Google Login and Global Leaderboard are not available in this environment. 
          Please configure your own Firebase project in `firebase-applet-config.json` to enable cloud features.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 lg:mb-10">
        <h2 className="text-2xl lg:text-3xl font-black text-[#3d312a] flex items-center gap-3">
          <Trophy className="text-amber-500 w-8 h-8 lg:w-10 lg:h-10" />
          <span>Global Leaderboard</span>
        </h2>
        <p className="text-[#6b6257] font-medium mt-2 max-w-2xl leading-relaxed">
          Rankings are based on <strong className="text-[#3d312a]">Total Points</strong> earned from strokes beneath par on completed holes.
        </p>
      </div>

      <div className="bg-[#fcfaf7] border border-[#3d312a]/10 rounded-3xl p-4 lg:p-6 overflow-hidden flex-1 flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#3d312a]/30 animate-spin mb-4" />
            <p className="text-[#7a7065] font-semibold">Loading rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Trophy className="w-12 h-12 text-[#3d312a]/10 mb-4" />
            <p className="text-[#7a7065] font-semibold">No rankings available yet.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {leaderboard.map((player, index) => {
              const isCurrentUser = player.id === currentUserUid;
              let rankIcon = null;
              
              if (index === 0) rankIcon = <Medal className="w-5 h-5 text-amber-400" />;
              else if (index === 1) rankIcon = <Medal className="w-5 h-5 text-slate-400" />;
              else if (index === 2) rankIcon = <Medal className="w-5 h-5 text-amber-700" />;
              
              const points = player.points ?? 0;
              const totalStrokes = player.totalScore ?? 0;
              const holesCompleted = player.bestScores ? Object.keys(player.bestScores).length : 0;

              return (
                <div 
                  key={player.id} 
                  className={`flex items-center p-3 sm:p-4 rounded-2xl border transition-all ${
                    isCurrentUser 
                      ? 'bg-[#3d312a] text-[#faf6ee] border-[#3d312a] shadow-md scale-[1.01]' 
                      : 'bg-white border-[#3d312a]/5 hover:border-[#3d312a]/20'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center font-black text-sm shrink-0 ${
                    isCurrentUser ? 'text-amber-400' : 'text-[#3d312a]/40'
                  }`}>
                    {rankIcon || `#${index + 1}`}
                  </div>
                  
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <h4 className={`font-bold truncate ${isCurrentUser ? 'text-white' : 'text-[#3d312a]'}`}>
                      {isCurrentUser ? 'You' : `Player ${player.id.substring(0, 4)}...`}
                    </h4>
                    <div className={`flex flex-wrap gap-2 text-xs font-semibold mt-1 ${isCurrentUser ? 'text-[#e2d8ce]' : 'text-[#7a7065]'}`}>
                      <span className="bg-black/10 px-2 py-0.5 rounded-full">{holesCompleted}/60 Holes</span>
                      <span className="bg-black/10 px-2 py-0.5 rounded-full">{totalStrokes} Strokes</span>
                    </div>
                  </div>
                  
                  <div className="ml-3 text-right">
                    <div className={`font-black text-lg ${isCurrentUser ? 'text-amber-400' : 'text-[#db5641]'}`}>
                      {points.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isCurrentUser ? 'text-[#e2d8ce]/60' : 'text-[#3d312a]/40'}`}>
                      Points
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
