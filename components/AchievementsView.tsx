import React, { useMemo } from 'react';
import { Award, Star, Zap, CircleDashed, FastForward, CheckCircle2, Gift } from 'lucide-react';
import { LEVELS, CYBER_LEVELS } from '../levels';
import { BALLS_STORE_ITEMS } from './BallStoreData';
import { Language, t } from '../utils/translations';

interface AchievementsViewProps {
  bestScores: Record<number, number>;
  coins: number;
  unlockedBallIds: string[];
  language?: Language;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ 
  bestScores, 
  coins, 
  unlockedBallIds,
  language = 'es'
}) => {
  const achievements = useMemo(() => {
    // Calculate total lifetime coins by summing current coins + spent coins
    const spentCoins = unlockedBallIds.reduce((total, id) => {
      const ball = BALLS_STORE_ITEMS.find(b => b.id === id);
      return total + (ball ? ball.price : 0);
    }, 0);
    
    const lifetimeCoins = coins + spentCoins;

    let birdies = 0;
    let eagles = 0;
    let holesInOne = 0;
    let holesCompleted = Object.keys(bestScores).length;

    Object.entries(bestScores).forEach(([levelIndexStr, strokes]) => {
      const levelIdx = parseInt(levelIndexStr, 10);
      const levelData = levelIdx >= 100 ? CYBER_LEVELS[levelIdx - 100] : LEVELS[levelIdx];
      if (!levelData) return;
      
      const par = levelData.par;
      if (strokes === 1) holesInOne++;
      
      const scoreDiff = strokes - par;
      if (scoreDiff === -1) birdies++;
      else if (scoreDiff <= -2) eagles++;
    });

    const list = [
      {
        id: 'first_steps',
        title: t('ach_firstSteps_title', language),
        description: t('ach_firstSteps_desc', language),
        icon: <FastForward className="w-6 h-6 text-emerald-500" />,
        unlocked: holesCompleted > 0,
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      },
      {
        id: 'birdie_master',
        title: t('ach_birdieMaster_title', language),
        description: t('ach_birdieMaster_desc', language),
        icon: <Star className="w-6 h-6 text-blue-500" />,
        unlocked: birdies + eagles + holesInOne >= 5, // Include better scores
        color: 'bg-blue-500/10 text-blue-600 border-blue-200',
        progress: `${Math.min(birdies + eagles + holesInOne, 5)} / 5`,
      },
      {
        id: 'eagle_eye',
        title: t('ach_eagleEye_title', language),
        description: t('ach_eagleEye_desc', language),
        icon: <Zap className="w-6 h-6 text-purple-500" />,
        unlocked: eagles + holesInOne >= 3,
        color: 'bg-purple-500/10 text-purple-600 border-purple-200',
        progress: `${Math.min(eagles + holesInOne, 3)} / 3`,
      },
      {
        id: 'ace_club',
        title: t('ach_aceClub_title', language),
        description: t('ach_aceClub_desc', language),
        icon: <CheckCircle2 className="w-6 h-6 text-rose-500" />,
        unlocked: holesInOne > 0,
        color: 'bg-rose-500/10 text-rose-600 border-rose-200',
        progress: `${Math.min(holesInOne, 1)} / 1`,
      },
      {
        id: 'century_club',
        title: t('ach_centuryClub_title', language),
        description: t('ach_centuryClub_desc', language),
        icon: <CircleDashed className="w-6 h-6 text-amber-500" />,
        unlocked: lifetimeCoins >= 100,
        color: 'bg-amber-500/10 text-amber-600 border-amber-200',
        progress: `${Math.min(lifetimeCoins, 100)} / 100`,
      },
      {
        id: 'ball_collector',
        title: t('ach_gearHead_title', language),
        description: t('ach_gearHead_desc', language),
        icon: <Gift className="w-6 h-6 text-teal-500" />,
        unlocked: unlockedBallIds.length >= 3,
        color: 'bg-teal-500/10 text-teal-600 border-teal-200',
        progress: `${Math.min(unlockedBallIds.length, 3)} / 3`,
      },
      {
        id: 'championship',
        title: t('ach_tourChampion_title', language),
        description: t('ach_tourChampion_desc', language),
        icon: <Award className="w-6 h-6 text-indigo-500" />,
        unlocked: holesCompleted >= 60,
        color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
        progress: `${Math.min(holesCompleted, 60)} / 60`,
      }
    ];

    return list;
  }, [bestScores, coins, unlockedBallIds, language]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 lg:mb-10">
        <h2 className="text-2xl lg:text-3xl font-black text-[#3d312a] flex items-center gap-3">
          <Award className="text-rose-500 w-8 h-8 lg:w-10 lg:h-10" />
          <span>{t('ach_title', language)}</span>
        </h2>
        <p className="text-[#6b6257] font-medium mt-2 max-w-2xl leading-relaxed">
          {t('ach_subtitle', language)}
        </p>
      </div>

      <div className="bg-[#fcfaf7] border border-[#3d312a]/10 rounded-3xl p-4 lg:p-6 overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {achievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`flex items-center p-3 sm:p-4 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? 'bg-white border-[#3d312a]/10 hover:border-[#3d312a]/30 shadow-sm'
                  : 'bg-black/5 border-transparent opacity-70 grayscale'
              }`}
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shrink-0 border ${
                achievement.unlocked ? achievement.color : 'bg-black/10 border-black/10 text-black/40'
              }`}>
                {achievement.icon}
              </div>
              
              <div className="ml-4 flex-1 min-w-0">
                <h4 className={`font-bold text-lg leading-tight ${achievement.unlocked ? 'text-[#3d312a]' : 'text-black/50'}`}>
                  {achievement.title}
                </h4>
                <p className={`text-sm font-medium mt-0.5 ${achievement.unlocked ? 'text-[#7a7065]' : 'text-black/40'}`}>
                  {achievement.description}
                </p>
              </div>

              {achievement.progress && (
                <div className={`ml-4 shrink-0 text-xs font-bold tracking-wider px-2 py-1 rounded-full ${
                  achievement.unlocked ? 'bg-[#3d312a] text-[#faf6ee]' : 'bg-black/10 text-black/50'
                }`}>
                  {achievement.unlocked ? t('store_owned', language).toUpperCase() : achievement.progress}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

