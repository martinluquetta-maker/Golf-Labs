import fs from 'fs';
let content = fs.readFileSync('levels.ts', 'utf-8');

const names = [
  'NEON RIDGE DATA-CHASM', 'THE FIRST HILL', 'BINARY JUNCTION', 'TELEPORT NODE',
  'ENCRYPTED BASTION', 'PRESSURE PLATES', 'THE TRIPLE JUMP', 'MULTI-RICOCHET',
  'HACKER\'S MAZE', 'CORE FIREWALL', 'THE YUMPS', 'THE FIRST WALL',
  'THE LOOP RAIL', 'GRAVITY SWITCH', 'NEURAL TUNNEL', 'THE MATRIX',
  'THE PRECIPICE', 'THE PARASITE', 'WIND GP-LOOP', 'FINAL GAUNTLET'
];

for (let i = 1; i <= 20; i++) {
  const regex = new RegExp(`parseLevel\\(${i}, '${i}', COLORS\\.[A-Z_]+, (\\d+), "[^"]+",`, 'g');
  content = content.replace(regex, `parseLevel(${i}, '${i}', COLORS.CYBER, $1, "${names[i-1]}",`);
}

// Update the header of ROW 1 to be Cyber World Experience
content = content.replace(/\/\/ ROW 1: LEVELS 1 - 20 \(Intro, Boosters, Gaps, Portals\)/g, '// ROW 1: LEVELS 1 - 20 (A Cyber World Experience)');

fs.writeFileSync('levels.ts', content);
