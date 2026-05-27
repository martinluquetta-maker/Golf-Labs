/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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
let isQuotaExhausted = false;

const _getScoreTerm = (strokes: number, par: number): string => {
  const diff = strokes - par;
  if (diff <= SCORE_ALBATROSS) return SCORE_TERMS[SCORE_ALBATROSS];
  return SCORE_TERMS[diff] || "Over Par";
};

export const getCaddyCommentary = async (
  levelName: string,
  strokes: number,
  par: number,
  result: 'WIN' | 'START',
  isFinalHole: boolean = false
): Promise<string> => {
  if (!ENABLE_AI_CADDY || isQuotaExhausted) return "";

  const fallbackMsg = result === 'START' ? "Let's play!" : "Nice finish!";
  const cacheKey = result === 'START' ? `start_${levelName}` : `win_${levelName}_${strokes}_${isFinalHole}`;

  if (commentaryCache[cacheKey]) return commentaryCache[cacheKey];
  if (!process.env.API_KEY) return fallbackMsg;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Level descriptions (same as Python)
    const levels: Record<string, string> = {
        "THE FIRST HILL": "LAYOUT: A horizontal layout. The ball starts on a high flat section, slopes down into a valley, then slopes up to a hill containing a purple-and-white booster tile. Past a gap is a floating platform, another gap, and a slope up to flat grass where the flag stands.\nSTART: Far left on high section.\nMECHANIC: Launch the ball onto the booster to get thrown over the gap to the floating platform and toward the hole.",
        "THE TWO JUMPS": "LAYOUT: A purely horizontal setup consisting of three individual platforms separated by empty gaps. The first platform has the start position, the second has a bouncy pad in the center, and the third platform has the hole.\nMECHANIC: Launch the ball onto the middle platform's bouncy pad to vault over the second gap and land on the green.",
        "THE RICOCHET": "LAYOUT: A tall vertical wall-enclosed arena. The ball starts on the bottom-left with an upward booster tile directly next to it. Middle floating walls act as barriers, and a vertical divider partitions the right corridor. The hole sits on a ledge at the top-right.\nMECHANIC: Launch the ball upwards using the booster, ricochet it around the middle floating walls, and navigate under the divider to use the bouncy pad at the bottom-right to reach the top-right ledge."
    };

    let prompt = "";
    if (result === 'START') {
        const desc = levels[levelName] || "";
        prompt = `You are a mini-golf caddy. You are respectful, kids could be around. The player is starting a level. The par is ${par}. Give a one-sentence tip or encouraging remark. Only respond with things that could be in a G rated film. Do NOT mention the hole name. Keep it short (max 15 words). Here is description of the course. use this to provide creative suggestions: ${desc}`;
    } else {
        const scoreTerm = _getScoreTerm(strokes, par);
        const finalNote = isFinalHole ? "This is the FINAL hole - do NOT mention 'next hole' or anything about continuing. " : "";
        prompt = `You are a mini-golf caddy. You are respectful, kids could be around. The player finished a level in ${strokes} strokes (Par ${par}). That's a ${scoreTerm}. Give a one-sentence reaction. Be enthusiastic, positive. Only respond with things that could be in a G rated film. If this is a hole in one, you should mention that. Do NOT mention the hole name. Do not reference the player's robotic helpers. Do not mention bots or droids ever. ${finalNote}Max 15 words.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          includeThoughts: false,
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        temperature: 1.0, 
      },
    });

    // CRITICAL: Updated response parsing for @google/genai
    const text = response.text?.trim();
    
    if (text) {
      commentaryCache[cacheKey] = text;
      return text;
    }
    
    return fallbackMsg;

  } catch (error: any) {
    console.error("Caddy Error:", error);
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        isQuotaExhausted = true;
    }
    return fallbackMsg;
  }
};