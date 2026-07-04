/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export const TILE_SIZE = 40;
export const FRICTION = 0.975; // Less friction so it rolls farther
export const SAND_FRICTION = 0.88; // Much higher friction for sand
export const VELOCITY_THRESHOLD = 0.05;
export const MAX_POWER = 20; 
export const POWER_MULTIPLIER = 0.2; 
export const HOLE_RADIUS = 8;
export const BALL_RADIUS = 7;
export const TELEPORT_TIME = 45; // Frames for teleportation effect (~0.75s)

export const ALLOW_HIT_WHILE_MOVING = true;
export const USE_ANDROID_SVG = true; 
export const ENABLE_AI_CADDY = true; // Configuration to disable the AI caddy to prevent API errors
export const ENABLE_DEV_TOOLS = false; // When false, hides level select, edit, and skip buttons during gameplay

export const COLORS = {
  // Hand-Made Color Palette (Monsieur Periné)
  BLUE: '#338ba8',       // Sky Blue (from 'A', 'C')
  RED: '#db5641',        // Vintage Coral-Red (from 'O')
  YELLOW: '#dfb12e',     // Vintage Mustard Yellow (from 'o')
  GREEN: '#6ca750',      // Soft Grass Green (from 'M')
  GREY: '#7a7065',       // Soft warm sand grey
  INDIGO: '#a35b91',     // Lavender Purple (from 'e')
  ANDROID: '#288a7c',    // Dark Teal (from 'n')
  DINO: '#d96b43',       // Terracotta Orange (from 'H', 'a')
  NEW_GREEN: '#288a7c',  // Teal Accent
  CYBER: '#060a14',      // Deep cyber void
  WHITE: '#faf6ee',      // Warm Watercolor paper white
  BLACK: '#3d312a',      // Charcoal rich coffee dark-brown
  FLAG: '#db5641',       // Vintage Coral
  CYBER_GRID: '#00ffff', // Neon Cyan
  CYBER_NEON: '#ff00ff', // Hot Magenta
  CYBER_LASER: '#ff2255', // Red Laser
  
  // Environment (Golf Course Elements)
  WALL: '#7c5f4b',       // Warm terracotta / wooden boundaries
  GRASS_LIGHT: '#ebd9c2', // Warm cream paper background as the light grass
  GRASS_DARK: '#1b2330',  // Slate grayish-blue sky and empty walls
  WATER: '#51a1b3',      // Sky Blue watercolor water
  SAND: '#dfb12e',       // Gold Yellow watercolor sand
  
  // UI & VFX
  VOID: '#1b2330',       // Slate grayish-blue empty void
  SHADOW: 'rgba(27, 35, 48, 0.16)', // Elegant rich shadow
  BALL_WHITE: '#ffffff', // Clean eggshell white ball
  BOUNCY_PAD: '#288a7c', // Teal bouncy pad stripes
  BOUNCY_PAD_SHADOW: 'rgba(27, 35, 48, 0.22)', // Matching shadow
  BOOST: '#288a7c',      // Teal boost glow
  GRASS_HIGHLIGHT: '#8cd96a', // Bright grass highlight
};

// Map characters
export const CHAR_WALL = '#';
export const CHAR_ARC = '*';
export const CHAR_INSIDE_ARC = '_';
export const CHAR_START = 'S';
export const CHAR_HOLE = 'H';
export const CHAR_EMPTY = '.';
export const CHAR_VOID = ' ';
export const CHAR_ANDROID = 'A';
export const CHAR_TREX = 'T';
export const CHAR_BOUNCY_PAD = 'B';
export const CHAR_BOOST_LEFT = '<';
export const CHAR_BOOST_RIGHT = '>';
export const CHAR_BOOST_UP = '^';
export const CHAR_BOOST_DOWN = 'v';
export const CHAR_WATER = 'W';
export const CHAR_WATER_ARC = 'w';
export const CHAR_SAND = 'Z';
export const CHAR_SAND_ARC = 'z';
