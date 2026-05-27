/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ScorePill from "./builds/ScorePill";
import { IconGolf, IconReset } from "./Icons";
import { GameState } from '../types';

interface FooterProps {
  gameState: GameState;
  par: number;
  numLevels: number;
  mulligan: () => void;
}

const Footer: React.FC<FooterProps> = ({ gameState, par, numLevels, mulligan }) => {
  return (
    <ScorePill>
      <div className="flex items-center gap-[4.5px] justify-center">
        <IconGolf size={20} />
        <span className="text-[16px] md:text-[18px]">Hole {gameState.currentLevelIndex + 1}/{numLevels}</span>
      </div>
      <div className="flex items-center gap-[4.5px] justify-center">
        <span className="text-[16px] md:text-[18px]">{par} Par</span>
      </div>
      <div className="flex items-center gap-[4.5px] justify-center">
        <span className="text-[16px] md:text-[18px]">{gameState.strokes} {gameState.strokes !== 1 ? "Strokes" : "Stroke"}</span>
      </div>
      <button className={'rounded-full bg-[#3d312a]/10 hover:bg-[#3d312a]/20 active:bg-[#3d312a]/30 p-1 transition-colors text-[#3d312a] flex items-center justify-center'} onClick={() => mulligan()} aria-label='mulligan' title='mulligan'>
        <IconReset size={24} width={24} height={24} />
      </button>
    </ScorePill>
  );
};

export default Footer;
