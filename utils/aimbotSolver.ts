/**
 * High-Precision Aimbot Solver for Mini-Golf
 * Calculates direct trajectories, bank/ricochet trick shots, and optimal fairway layups.
 */

import { Vector2, Wall, Decoration } from '../types';
import { 
  TILE_SIZE, 
  BALL_RADIUS, 
  HOLE_RADIUS, 
  FRICTION, 
  MAX_POWER 
} from '../constants';

export interface AimbotSolution {
  found: boolean;
  isDirect: boolean;
  isHoleInOne: boolean;
  angle: number; // in radians
  powerPercent: number; // 5 to 100
  bounces: number;
  trajectoryPoints: Vector2[];
  confidence: number; // 0 to 100%
  type: 'DIRECT' | 'BANK' | 'LAYUP';
  description: string;
  distanceToHole: number;
}

interface BoostTile extends Vector2 {
  dx: number;
  dy: number;
}

interface WaterArcTile extends Vector2 {
  orientation: 'NW' | 'NE' | 'SW' | 'SE';
}

interface SimResult {
  sunk: boolean;
  hitHazard: boolean;
  bounces: number;
  minDistToHole: number;
  finalDistToHole: number;
  points: Vector2[];
  steps: number;
}

/**
 * Fast forward simulation of a single shot
 */
function simulateShot(
  startPos: Vector2,
  angle: number,
  powerPercent: number,
  holePos: Vector2,
  walls: Wall[],
  decorations: Decoration[],
  boostTiles: BoostTile[],
  waterTiles: Vector2[],
  waterArcs: WaterArcTile[],
  maxSteps = 120
): SimResult {
  const speed = (powerPercent / 100) * MAX_POWER;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let x = startPos.x;
  let y = startPos.y;
  const radius = BALL_RADIUS;

  let bounces = 0;
  let minDistToHole = Math.hypot(x - holePos.x, y - holePos.y);
  let hitHazard = false;
  let sunk = false;
  const points: Vector2[] = [{ x, y }];

  for (let step = 0; step < maxSteps; step++) {
    // 1. Check hole capture
    const dxHole = x - holePos.x;
    const dyHole = y - holePos.y;
    const distToHole = Math.sqrt(dxHole * dxHole + dyHole * dyHole);
    if (distToHole < minDistToHole) {
      minDistToHole = distToHole;
    }

    const currentSpeed = Math.sqrt(vx * vx + vy * vy);
    if (distToHole < HOLE_RADIUS && currentSpeed < 15) {
      points.push({ x: holePos.x, y: holePos.y });
      sunk = true;
      break;
    }

    // Stop if speed drops below threshold
    if (currentSpeed < 0.05) {
      break;
    }

    // Record sample point periodically or on bounce
    if (step % 5 === 0) {
      points.push({ x, y });
    }

    // 2. Advance position
    x += vx;
    y += vy;

    // 3. Water hazard check
    for (let i = 0; i < waterTiles.length; i++) {
      const wt = waterTiles[i];
      if (x >= wt.x && x <= wt.x + TILE_SIZE && y >= wt.y && y <= wt.y + TILE_SIZE) {
        if (currentSpeed < 6) {
          hitHazard = true;
          return {
            sunk: false,
            hitHazard: true,
            bounces,
            minDistToHole,
            finalDistToHole: distToHole,
            points,
            steps: step
          };
        }
      }
    }

    // 4. Boost tiles
    for (let i = 0; i < boostTiles.length; i++) {
      const bt = boostTiles[i];
      if (x >= bt.x && x <= bt.x + TILE_SIZE && y >= bt.y && y <= bt.y + TILE_SIZE) {
        vx += bt.dx * 0.4;
        vy += bt.dy * 0.4;
        const sp = Math.sqrt(vx * vx + vy * vy);
        if (sp > 30) {
          vx = (vx / sp) * 30;
          vy = (vy / sp) * 30;
        }
      }
    }

    // 5. Walls collision
    let collidedWithWall = false;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (w.type === 'SQUARE') {
        const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
        const dx = x - closestX;
        const dy = y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 0.001;
          const normalX = dx / dist;
          const normalY = dy / dist;
          const dot = vx * normalX + vy * normalY;

          if (dot < 0) {
            x = closestX + normalX * radius;
            y = closestY + normalY * radius;
            vx = vx - 1.8 * dot * normalX;
            vy = vy - 1.8 * dot * normalY;
            bounces++;
            collidedWithWall = true;
            points.push({ x, y });
          }
        }
      } else if (w.type === 'ARC' || w.type === 'INSIDE_ARC') {
        let cx = w.x;
        let cy = w.y;
        if (w.orientation === 'NE') cx = w.x + w.w;
        else if (w.orientation === 'SW') cy = w.y + w.h;
        else if (w.orientation === 'SE') { cx = w.x + w.w; cy = w.y + w.h; }

        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const arcRadius = TILE_SIZE;

        if (w.type === 'ARC') {
          if (dist < arcRadius + radius && dist > arcRadius - radius) {
            if (x >= w.x - radius && x <= w.x + w.w + radius &&
                y >= w.y - radius && y <= w.y + w.h + radius) {
              const normalX = dx / dist;
              const normalY = dy / dist;
              const dot = vx * normalX + vy * normalY;
              if (dot < 0) {
                const overlap = (arcRadius + radius) - dist;
                x += normalX * overlap;
                y += normalY * overlap;
                vx = vx - 1.8 * dot * normalX;
                vy = vy - 1.8 * dot * normalY;
                bounces++;
                collidedWithWall = true;
                points.push({ x, y });
              }
            }
          }
        } else if (w.type === 'INSIDE_ARC') {
          if (dist > arcRadius - radius) {
            if (x >= w.x - radius && x <= w.x + w.w + radius &&
                y >= w.y - radius && y <= w.y + w.h + radius) {
              const normalX = -dx / dist;
              const normalY = -dy / dist;
              const dot = vx * normalX + vy * normalY;
              if (dot < 0) {
                const overlap = dist - (arcRadius - radius);
                x += normalX * overlap;
                y += normalY * overlap;
                vx = vx - 1.8 * dot * normalX;
                vy = vy - 1.8 * dot * normalY;
                bounces++;
                collidedWithWall = true;
                points.push({ x, y });
              }
            }
          }
        }
      }
    }

    // 6. Bouncy pads / decorations
    for (let i = 0; i < decorations.length; i++) {
      const d = decorations[i];
      if (d.type === 'BOUNCY_PAD') {
        const dx = x - d.pos.x;
        const dy = y - d.pos.y;
        const distSq = dx * dx + dy * dy;
        const minDist = radius + d.radius;
        if (distSq < minDist * minDist && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          vx = nx * 18;
          vy = ny * 18;
          x = d.pos.x + nx * (minDist + 2);
          y = d.pos.y + ny * (minDist + 2);
          bounces++;
          points.push({ x, y });
        }
      }
    }

    // 7. Friction
    vx *= FRICTION;
    vy *= FRICTION;
  }

  points.push({ x, y });

  const finalDist = Math.hypot(x - holePos.x, y - holePos.y);
  return {
    sunk,
    hitHazard,
    bounces,
    minDistToHole,
    finalDistToHole: finalDist,
    points,
    steps: maxSteps
  };
}

/**
 * Solves the optimal aimbot shot for the given game state
 */
export function solveAimbot(
  ballPos: Vector2,
  holePos: Vector2,
  walls: Wall[],
  decorations: Decoration[] = [],
  boostTiles: BoostTile[] = [],
  waterTiles: Vector2[] = [],
  waterArcs: WaterArcTile[] = []
): AimbotSolution {
  const dx = holePos.x - ballPos.x;
  const dy = holePos.y - ballPos.y;
  const directDistance = Math.hypot(dx, dy);
  const directAngle = Math.atan2(dy, dx);

  // Normalize angle to [0, 2PI)
  const normAngle = (a: number) => {
    let r = a % (Math.PI * 2);
    if (r < 0) r += Math.PI * 2;
    return r;
  };

  // Phase 1: Test direct shot with fine powers
  const powerCandidates = [
    12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 85, 90, 95, 100
  ];

  // Try direct angle first
  for (const p of powerCandidates) {
    const res = simulateShot(
      ballPos, 
      directAngle, 
      p, 
      holePos, 
      walls, 
      decorations, 
      boostTiles, 
      waterTiles, 
      waterArcs,
      130
    );

    if (res.sunk && res.bounces === 0 && !res.hitHazard) {
      return {
        found: true,
        isDirect: true,
        isHoleInOne: true,
        angle: normAngle(directAngle),
        powerPercent: p,
        bounces: 0,
        trajectoryPoints: res.points,
        confidence: 100,
        type: 'DIRECT',
        description: 'Direct Hole-In-One Lock',
        distanceToHole: directDistance
      };
    }
  }

  // Phase 1b: Try minor angle nudges (±0.5°, ±1°, ±1.5°, ±2°, ±3°) around direct angle
  const angleNudges = [-0.052, -0.035, -0.017, 0.017, 0.035, 0.052];
  for (const nudge of angleNudges) {
    const testAngle = directAngle + nudge;
    for (const p of [25, 35, 45, 55, 65, 75, 85, 95]) {
      const res = simulateShot(
        ballPos, 
        testAngle, 
        p, 
        holePos, 
        walls, 
        decorations, 
        boostTiles, 
        waterTiles, 
        waterArcs,
        130
      );
      if (res.sunk && res.bounces === 0 && !res.hitHazard) {
        return {
          found: true,
          isDirect: true,
          isHoleInOne: true,
          angle: normAngle(testAngle),
          powerPercent: p,
          bounces: 0,
          trajectoryPoints: res.points,
          confidence: 100,
          type: 'DIRECT',
          description: 'Direct Hole-In-One Lock',
          distanceToHole: directDistance
        };
      }
    }
  }

  // Phase 2: Bank Shot / Ricochet Search (360 degrees sweep)
  // Sweep candidate angles in 3-degree increments
  let bestBankShot: { angle: number; power: number; bounces: number; points: Vector2[] } | null = null;
  const sweepPowers = [35, 50, 65, 78, 90, 100];
  const numAngleSteps = 120; // 3 degrees per step

  for (let i = 0; i < numAngleSteps; i++) {
    const angle = (i * 2 * Math.PI) / numAngleSteps;
    for (const p of sweepPowers) {
      const res = simulateShot(
        ballPos,
        angle,
        p,
        holePos,
        walls,
        decorations,
        boostTiles,
        waterTiles,
        waterArcs,
        140
      );

      if (res.sunk && !res.hitHazard) {
        if (!bestBankShot || res.bounces < bestBankShot.bounces) {
          bestBankShot = {
            angle: normAngle(angle),
            power: p,
            bounces: res.bounces,
            points: res.points
          };
          if (res.bounces <= 1) break; // 1-bounce is ideal bank shot
        }
      }
    }
    if (bestBankShot && bestBankShot.bounces <= 1) {
      break;
    }
  }

  if (bestBankShot) {
    return {
      found: true,
      isDirect: false,
      isHoleInOne: true,
      angle: bestBankShot.angle,
      powerPercent: bestBankShot.power,
      bounces: bestBankShot.bounces,
      trajectoryPoints: bestBankShot.points,
      confidence: 96,
      type: 'BANK',
      description: `${bestBankShot.bounces}-Bounce Trick Sink`,
      distanceToHole: directDistance
    };
  }

  // Phase 3: Layup / Progress Shot
  // If no single shot sinks, find the angle & power that lands closest to the hole safely
  let bestLayup: { angle: number; power: number; finalDist: number; points: Vector2[] } | null = null;

  for (let i = 0; i < numAngleSteps; i += 2) {
    const angle = (i * 2 * Math.PI) / numAngleSteps;
    for (const p of [30, 50, 70, 90]) {
      const res = simulateShot(
        ballPos,
        angle,
        p,
        holePos,
        walls,
        decorations,
        boostTiles,
        waterTiles,
        waterArcs,
        100
      );

      if (!res.hitHazard) {
        if (!bestLayup || res.finalDistToHole < bestLayup.finalDist) {
          bestLayup = {
            angle: normAngle(angle),
            power: p,
            finalDist: res.finalDistToHole,
            points: res.points
          };
        }
      }
    }
  }

  if (bestLayup) {
    return {
      found: true,
      isDirect: false,
      isHoleInOne: false,
      angle: bestLayup.angle,
      powerPercent: bestLayup.power,
      bounces: 0,
      trajectoryPoints: bestLayup.points,
      confidence: Math.max(60, Math.min(92, Math.round(100 - (bestLayup.finalDist / directDistance) * 40))),
      type: 'LAYUP',
      description: 'Optimal Fairway Layup',
      distanceToHole: directDistance
    };
  }

  // Fallback: direct line with 45% power
  return {
    found: true,
    isDirect: true,
    isHoleInOne: false,
    angle: normAngle(directAngle),
    powerPercent: 45,
    bounces: 0,
    trajectoryPoints: [ballPos, holePos],
    confidence: 70,
    type: 'DIRECT',
    description: 'Straight Aim Line',
    distanceToHole: directDistance
  };
}
