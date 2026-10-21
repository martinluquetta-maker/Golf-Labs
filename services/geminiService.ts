/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { ENABLE_AI_CADDY } from "../constants";

const SCORE_ALBATROSS = -3;
const SCORE_EAGLE = -2;
const SCORE_BIRDIE = -1;
const SCORE_PAR = 0;
const SCORE_BOGEY = 1;
const SCORE_DOUBLE_BOGEY = 2;

const SCORE_TERMS: Record<number, string> = {
  [SCORE_ALBATROSS]: "Albatross",
  [SCORE_EAGLE]: "Eagle",
  [SCORE_BIRDIE]: "Birdie",
  [SCORE_PAR]: "Par",
  [SCORE_BOGEY]: "Bogey",
  [SCORE_DOUBLE_BOGEY]: "Double Bogey",
};

const commentaryCache: Record<string, string> = {};

const _getScoreTerm = (strokes: number, par: number): string => {
  const diff = strokes - par;
  if (diff <= SCORE_ALBATROSS) return SCORE_TERMS[SCORE_ALBATROSS];
  return SCORE_TERMS[diff] || "Over Par";
};

// Rich, entertaining fallback dialogue for when offline or network unavailable
const START_TIPS = [
  "Take your time to gauge the slope and bank your shot off the wall!",
  "A smooth, measured backswing will keep you clear of the hazard tiles.",
  "Check the portals and booster pads before taking your first swing!",
  "Aim for the center path — patience wins tournaments!",
  "Keep your eye on the flag and trust your putting instincts.",
  "Study the angles! Ricochets can turn impossible angles into easy putts.",
  "Smooth and steady. Par is waiting right in the cup!"
];

const WIN_REACTIONS_HIO = [
  "HOLE-IN-ONE! Pure genius on that single swing!",
  "ACE! That was an absolute masterclass shot right into the cup!",
  "Incredible! One swing, perfection, nothing but net!",
  "Hole in one! The gallery is on their feet for that shot!"
];

const WIN_REACTIONS_UNDER_PAR = [
  "Brilliant birdie! You made that tricky angle look effortless.",
  "Under par and clinical! Outstanding course management.",
  "Sensational touch on the green! Beautiful finish.",
  "Textbook golf! You shaved strokes right off the par rating."
];

const WIN_REACTIONS_PAR = [
  "Solid par! Calm, composed, and right into the cup.",
  "Even par — that keeps your tournament scorecard rock steady!",
  "Right in the center of the cup. Great recovery and poise.",
  "Clean finish! You matched the course architect shot for shot."
];

const WIN_REACTIONS_OVER_PAR = [
  "In the cup! Tough obstacles, but great resilience to sink it.",
  "Good battle! You fought hard and closed out the hole.",
  "Sunk at last! Onward to the next challenge.",
  "Nicely recovered! Every hole is a fresh start."
];

function getRandomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getContextualFallback(strokes: number, par: number, result: 'WIN' | 'START', isFinalHole: boolean): string {
  if (result === 'START') {
    return getRandomItem(START_TIPS);
  }

  if (isFinalHole) {
    if (strokes === 1) return "HOLE-IN-ONE on the championship final hole! Legendary!";
    if (strokes <= par) return "Championship complete with an incredible finish! Congratulations!";
    return "Course complete! What a fantastic tournament run!";
  }

  if (strokes === 1) {
    return getRandomItem(WIN_REACTIONS_HIO);
  }

  const diff = strokes - par;
  if (diff < 0) {
    return getRandomItem(WIN_REACTIONS_UNDER_PAR);
  } else if (diff === 0) {
    return getRandomItem(WIN_REACTIONS_PAR);
  } else {
    return getRandomItem(WIN_REACTIONS_OVER_PAR);
  }
}

export const getCaddyCommentary = async (
  levelName: string,
  strokes: number,
  par: number,
  result: 'WIN' | 'START',
  isFinalHole: boolean = false
): Promise<string> => {
  if (!ENABLE_AI_CADDY) return "";

  const cacheKey = result === 'START' ? `start_${levelName}` : `win_${levelName}_${strokes}_${isFinalHole}`;
  if (commentaryCache[cacheKey]) return commentaryCache[cacheKey];

  const fallbackMsg = getContextualFallback(strokes, par, result, isFinalHole);

  // Level descriptions to feed context to server-side Gemini
  const levels: Record<string, string> = {
    "THE FIRST HILL": "Horizontal layout with slopes, gap and booster tile leading to hole platform.",
    "THE TWO JUMPS": "Three floating platforms with bouncy pad in center vaulting to green.",
    "THE RICOCHET": "Vertical arena with floating walls and bouncy pad at bottom-right.",
    "PORTAL MAZE": "Maze of colored portals and teleporters connecting distant corners."
  };

  let prompt = "";
  if (result === 'START') {
    const desc = levels[levelName] || "";
    prompt = `You are a friendly, encouraging mini-golf caddy. The player is teeing off on a level with Par ${par}. Give a brief 1-sentence tip or encouraging remark (under 14 words). G-rated, no mention of hole name or robot droids. Context: ${desc}`;
  } else {
    const scoreTerm = _getScoreTerm(strokes, par);
    const finalNote = isFinalHole ? "This is the FINAL hole of the championship! " : "";
    prompt = `You are an enthusiastic mini-golf caddy. The player just finished a hole in ${strokes} strokes (Par ${par}, ${scoreTerm}). ${strokes === 1 ? 'This was a HOLE-IN-ONE! Celebrate that!' : ''} Give a 1-sentence positive reaction (under 14 words). ${finalNote}G-rated, do NOT mention robots or bots.`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('/api/caddy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.text === 'string' && data.text.trim()) {
        const text = data.text.trim().replace(/^["']|["']$/g, '');
        commentaryCache[cacheKey] = text;
        return text;
      }
    }
  } catch {
    // Graceful silent fallback to prevent unhandled UI errors
  }

  commentaryCache[cacheKey] = fallbackMsg;
  return fallbackMsg;
};