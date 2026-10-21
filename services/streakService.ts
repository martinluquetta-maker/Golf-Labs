/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyStreakData {
  streakCount: number;
  lastLoginDate: string; // YYYY-MM-DD
  lastClaimDate: string; // YYYY-MM-DD
  totalDaysClaimed: number;
}

export interface StreakTier {
  day: number;
  rewardCoins: number;
  label: string;
  isMilestone?: boolean;
}

export const STREAK_TIERS: StreakTier[] = [
  { day: 1, rewardCoins: 100, label: "Tee Off" },
  { day: 2, rewardCoins: 150, label: "Fairway" },
  { day: 3, rewardCoins: 200, label: "Green" },
  { day: 4, rewardCoins: 250, label: "Birdie" },
  { day: 5, rewardCoins: 350, label: "Eagle", isMilestone: true },
  { day: 6, rewardCoins: 450, label: "Albatross" },
  { day: 7, rewardCoins: 600, label: "Hole in One Master", isMilestone: true },
];

export function getRewardForStreakDay(day: number): number {
  if (day <= 0) return 100;
  if (day <= 7) {
    const tier = STREAK_TIERS.find(t => t.day === day);
    return tier ? tier.rewardCoins : 100;
  }
  // For streaks beyond 7 days, provide 600 + 20 coins per extra day up to 1000 max
  return Math.min(1000, 600 + (day - 7) * 20);
}

/**
 * Returns YYYY-MM-DD in user's local timezone
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD strings
 */
export function getDayDifference(todayStr: string, pastStr: string): number {
  if (!todayStr || !pastStr) return 999;
  try {
    const [tY, tM, tD] = todayStr.split('-').map(Number);
    const [pY, pM, pD] = pastStr.split('-').map(Number);
    const todayDate = new Date(tY, tM - 1, tD).getTime();
    const pastDate = new Date(pY, pM - 1, pD).getTime();
    return Math.round((todayDate - pastDate) / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

const LOCAL_STORAGE_STREAK_KEY = 'golf_lab_daily_streak';

export function getLocalStreakData(): DailyStreakData {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_STREAK_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        streakCount: Math.max(0, Number(parsed.streakCount) || 0),
        lastLoginDate: parsed.lastLoginDate || '',
        lastClaimDate: parsed.lastClaimDate || '',
        totalDaysClaimed: Math.max(0, Number(parsed.totalDaysClaimed) || 0),
      };
    }
  } catch {
    // fallback
  }

  return {
    streakCount: 0,
    lastLoginDate: '',
    lastClaimDate: '',
    totalDaysClaimed: 0,
  };
}

export function saveLocalStreakData(data: DailyStreakData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_STREAK_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export interface StreakProcessResult {
  updatedData: DailyStreakData;
  rewardClaimedNow: boolean;
  coinsAwarded: number;
  streakDay: number;
  isConsecutive: boolean;
}

/**
 * Evaluates login streak for today and awards bonus coins if eligible.
 */
export function processDailyStreak(currentStreak?: DailyStreakData | null): StreakProcessResult {
  const current = currentStreak || getLocalStreakData();
  const today = getLocalDateString();

  // If already logged in and claimed today
  if (current.lastClaimDate === today) {
    return {
      updatedData: {
        ...current,
        lastLoginDate: today,
      },
      rewardClaimedNow: false,
      coinsAwarded: 0,
      streakDay: current.streakCount || 1,
      isConsecutive: false,
    };
  }

  let nextStreak = 1;
  let isConsecutive = false;

  if (!current.lastLoginDate) {
    // First ever login
    nextStreak = 1;
  } else {
    const diff = getDayDifference(today, current.lastLoginDate);
    if (diff === 0) {
      // Same day, but hasn't claimed yet today
      nextStreak = Math.max(1, current.streakCount);
    } else if (diff === 1) {
      // Exactly consecutive day!
      nextStreak = current.streakCount + 1;
      isConsecutive = true;
    } else {
      // Missed one or more days -> streak resets to 1
      nextStreak = 1;
    }
  }

  const coinsAwarded = getRewardForStreakDay(nextStreak);
  const updatedData: DailyStreakData = {
    streakCount: nextStreak,
    lastLoginDate: today,
    lastClaimDate: today,
    totalDaysClaimed: (current.totalDaysClaimed || 0) + 1,
  };

  saveLocalStreakData(updatedData);

  return {
    updatedData,
    rewardClaimedNow: true,
    coinsAwarded,
    streakDay: nextStreak,
    isConsecutive,
  };
}
