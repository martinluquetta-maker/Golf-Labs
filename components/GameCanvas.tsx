/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, LevelData, Vector2, Wall, Decoration, PortalExitConfig } from '../types';
import { 
  TILE_SIZE, 
  COLORS, 
  CHAR_WALL, 
  CHAR_ARC,
  CHAR_INSIDE_ARC,
  CHAR_START, 
  CHAR_HOLE, 
  CHAR_VOID,
  CHAR_ANDROID,
  CHAR_TREX,
  CHAR_BOUNCY_PAD,
  CHAR_BOOST_LEFT,
  CHAR_BOOST_RIGHT,
  CHAR_BOOST_UP,
  CHAR_BOOST_DOWN,
  CHAR_WATER,
  CHAR_WATER_ARC,
  CHAR_SAND,
  CHAR_SAND_ARC,
  BALL_RADIUS, 
  FRICTION, 
  SAND_FRICTION,
  VELOCITY_THRESHOLD, 
  MAX_POWER, 
  POWER_MULTIPLIER, 
  HOLE_RADIUS,
  ALLOW_HIT_WHILE_MOVING,
  TELEPORT_TIME,
  USE_ANDROID_SVG
} from '../constants';
import useAudio from "../hooks/useAudio";
import { getPath } from "../utils/path";

import { ICON_PATHS } from './Icons';
import { PORTRAIT_SCALE_OVERRIDES } from '../levels';
import { BALLS_STORE_ITEMS, TRAILS_STORE_ITEMS, TrailItem } from './BallStoreData';

interface BoostTile extends Vector2 {
  dx: number;
  dy: number;
}

interface WaterArcTile extends Vector2 {
  orientation: 'NW' | 'NE' | 'SW' | 'SE';
}

interface SandArcTile extends Vector2 {
  orientation: 'NW' | 'NE' | 'SW' | 'SE';
}

interface PortalTile extends Vector2 {
  id: string; // '1' - '9'
}

interface PendingTeleport {
  targetPortal: PortalTile;
  exitConfig?: PortalExitConfig;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'square' | 'triangle';
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  secondaryColor?: string;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  type: string;
  glow?: string;
}

interface GameCanvasProps {
  level: LevelData;
  onStroke: () => void;
  onHole: () => void;
  equippedBallId?: string;
  equippedTrailId?: string;
  strokes: number;
}

const TARGET_FPS = 60;
const FRAME_DURATION = 1000 / TARGET_FPS;

const GameCanvas: React.FC<GameCanvasProps> = ({ level, onStroke, onHole, equippedBallId, equippedTrailId, strokes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallsRef = useRef<Wall[]>([]);
  const decorationsRef = useRef<Decoration[]>([]);
  const boostTilesRef = useRef<BoostTile[]>([]);
  const waterTilesRef = useRef<Vector2[]>([]);
  const waterArcsRef = useRef<WaterArcTile[]>([]);
  const sandTilesRef = useRef<Vector2[]>([]);
  const sandArcsRef = useRef<SandArcTile[]>([]);
  const portalsRef = useRef<PortalTile[]>([]);
  const holeRef = useRef<Vector2 | null>(null);
  const startPosRef = useRef<Vector2 | null>(null);
  const offsetRef = useRef<Vector2>({ x: 0, y: 0 });
  const physicalScaleRef = useRef<number>(1);
  
  const portalCooldownRef = useRef<number>(0);
  const lastExitedPortalRef = useRef<PortalTile | null>(null);
  const pendingTeleportRef = useRef<PendingTeleport | null>(null);
  
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const ballRef = useRef<Ball | null>(null); 
  const textureRef = useRef<HTMLImageElement | null>(null);
  const shockwavesRef = useRef<Array<{ x: number; y: number; r: number; maxR: number; color: string; alpha: number }>>([]);
  const confettiParticlesRef = useRef<ConfettiParticle[]>([]);
  const trailParticlesRef = useRef<TrailParticle[]>([]);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isAiming, setIsAiming] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null);
  const { playForeground } = useAudio();

  // Mobile / Touch controls state variables
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(false);
  const [touchAngle, setTouchAngle] = useState(0); // Angle in radians
  const [touchPower, setTouchPower] = useState(50); // Power percentage (1 to 100)
  const [isBallMoving, setIsBallMoving] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const [dialDragging, setDialDragging] = useState(false);
  const dialDragStartRef = useRef<number>(0);
  const dialAngleStartRef = useRef<number>(0);

  // Auto-detect mobile devices to enable touch controls panel by default
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = typeof window !== 'undefined' && (
        /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) && 
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      );
      if (isMobileDevice) {
        setTouchControlsEnabled(true);
      }
    };
    checkMobile();
  }, []);

  useEffect(() => {
    const img = new Image();
    const gridWidth = level.grid[0].length;
    const gridHeight = level.grid.length;
    const isHorizontal = gridWidth > gridHeight;
    
    img.src = getPath(isHorizontal 
      ? '/media/images/builds/brand-gradient-horizontal.png'
      : '/media/images/builds/brand-gradient-vertical.png'
    );
    img.onload = () => {
      textureRef.current = img;
    };
  }, [level]);

  const calculateLayout = useCallback((width: number, height: number) => {
    if (width === 0 || height === 0) return { x: 0, y: 0 };
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const gridWidth = level.grid[0].length * TILE_SIZE;
    const gridHeight = level.grid.length * TILE_SIZE;
    
    const isPortrait = height > width && width < 640; // Treat narrow screens as portrait regardless of height
    
    if (isPortrait) {
      // In portrait mode: prefer full width but respect height constraints with minor margin
      const widthScale = (width - 24) / gridWidth;
      const heightScale = (height - 90) / gridHeight;
      
      let baseScale = Math.min(widthScale, heightScale);
      
      // Apply manual scale override if configured for this level
      const scaleOverride = PORTRAIT_SCALE_OVERRIDES[level.id];
      if (scaleOverride !== undefined) {
        baseScale *= scaleOverride;
      }
      
      // Give a default scale boost to always keep the course generous
      baseScale *= 1.15;
      
      const physicalTileSize = Math.max(1, Math.ceil(TILE_SIZE * baseScale * dpr));
      physicalScaleRef.current = physicalTileSize / TILE_SIZE;
      
      const scaledWidth = gridWidth * (physicalTileSize / (TILE_SIZE * dpr));
      const scaledHeight = gridHeight * (physicalTileSize / (TILE_SIZE * dpr));
      
      return {
        x: Math.floor((width - scaledWidth) / 2), // Center horizontally
        y: Math.floor((height - scaledHeight) / 2) // Center vertically
      };
    } else {
      // In landscape mode: fit within available space with small padding
      let availableW = width - 40;
      let availableH = height - 40; // No extra large subtractions since container is already capped
      
      const baseScale = Math.min(availableW / gridWidth, availableH / gridHeight, 2.5); // Allow much larger maximum scale
      const physicalTileSize = Math.max(1, Math.floor(TILE_SIZE * baseScale * dpr));
      physicalScaleRef.current = physicalTileSize / TILE_SIZE;
      
      return {
        x: Math.floor((width - (gridWidth * (physicalTileSize / (TILE_SIZE * dpr)))) / 2),
        y: Math.floor((height - (gridHeight * (physicalTileSize / (TILE_SIZE * dpr)))) / 2)
      };
    }
  }, [level]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        offsetRef.current = calculateLayout(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);
    
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });
    offsetRef.current = calculateLayout(rect.width, rect.height);

    return () => resizeObserver.disconnect();
  }, [calculateLayout]);

  useEffect(() => {
    const walls: Wall[] = [];
    const decorations: Decoration[] = [];
    const boostTiles: BoostTile[] = [];
    const waterTiles: Vector2[] = [];
    const waterArcs: WaterArcTile[] = [];
    const sandTiles: Vector2[] = [];
    const sandArcs: SandArcTile[] = [];
    const portals: PortalTile[] = [];
    let start: Vector2 = { x: 0, y: 0 };
    let hole: Vector2 = { x: 0, y: 0 };

    const isSolid = (r: number, c: number) => {
      if (r < 0 || r >= level.grid.length || c < 0 || c >= level.grid[0].length) return false;
      const char = level.grid[r][c];
      return char === CHAR_WALL || char === CHAR_ARC || char === CHAR_INSIDE_ARC;
    };

    const isWatery = (r: number, c: number) => {
      if (r < 0 || r >= level.grid.length || c < 0 || c >= level.grid[0].length) return false;
      const char = level.grid[r][c];
      return char === CHAR_WATER || char === CHAR_WATER_ARC || char === CHAR_SAND_ARC;
    };

    const isSandy = (r: number, c: number) => {
      if (r < 0 || r >= level.grid.length || c < 0 || c >= level.grid[0].length) return false;
      const char = level.grid[r][c];
      return char === CHAR_SAND || char === CHAR_SAND_ARC || char === CHAR_WATER_ARC;
    };
    
    level.grid.forEach((row, rowIndex) => {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const char = row[colIndex];
        const x = colIndex * TILE_SIZE;
        const y = rowIndex * TILE_SIZE;

        if (char === CHAR_WALL) {
          walls.push({ x, y, w: TILE_SIZE, h: TILE_SIZE, type: 'SQUARE' });
        } else if (char === CHAR_ARC || char === CHAR_INSIDE_ARC) {
          let N = isSolid(rowIndex - 1, colIndex);
          let S = isSolid(rowIndex + 1, colIndex);
          let W = isSolid(rowIndex, colIndex - 1);
          let E = isSolid(rowIndex, colIndex + 1);
          if(char === CHAR_INSIDE_ARC) {
            N=!N; S=!S; W=!W; E=!E;
          }

          let orientation: 'NW' | 'NE' | 'SW' | 'SE' = 'NW';
          if (N && W) orientation = 'NW';
          else if (N && E) orientation = 'NE';
          else if (S && W) orientation = 'SW';
          else if (S && E) orientation = 'SE';
          
          walls.push({ 
            x, y, w: TILE_SIZE, h: TILE_SIZE, 
            type: char === CHAR_ARC ? 'ARC' : 'INSIDE_ARC', 
            orientation 
          });
        } else if (char === CHAR_START) {
          start = { x: x + TILE_SIZE / 2, y: y + TILE_SIZE / 2 };
        } else if (char === CHAR_HOLE) {
          hole = { x: x + TILE_SIZE / 2, y: y + TILE_SIZE / 2 };
        } else if (char === CHAR_ANDROID) {
          decorations.push({ 
            type: 'ANDROID', 
            pos: { x: x + TILE_SIZE/2, y: y + TILE_SIZE/2 }, 
            radius: TILE_SIZE/2,
            vel: { x: 0, y: 1.2 } 
          });
        } else if (char === CHAR_TREX) {
          decorations.push({ 
            type: 'TREX', 
            pos: { x: x + TILE_SIZE/2, y: y + TILE_SIZE/2 }, 
            radius: TILE_SIZE/2,
            vel: { x: 1.5, y: 0 } 
          });
        } else if (char === CHAR_BOUNCY_PAD) {
          decorations.push({
            type: 'BOUNCY_PAD',
            pos: { x: x + TILE_SIZE / 2, y: y + TILE_SIZE / 2 },
            radius: TILE_SIZE / 2,
            scale: 1,
            targetScale: 1
          });
        } else if (char === CHAR_BOOST_LEFT || char === CHAR_BOOST_RIGHT || char === CHAR_BOOST_UP || char === CHAR_BOOST_DOWN) {
          let dx = 0, dy = 0;
          if (char === CHAR_BOOST_LEFT) dx = -1;
          else if (char === CHAR_BOOST_RIGHT) dx = 1;
          else if (char === CHAR_BOOST_UP) dy = -1;
          else if (char === CHAR_BOOST_DOWN) dy = 1;
          boostTiles.push({ x: colIndex * TILE_SIZE, y: rowIndex * TILE_SIZE, dx, dy });
        } else if (char === CHAR_WATER) {
          waterTiles.push({ x: colIndex * TILE_SIZE, y: rowIndex * TILE_SIZE });
        } else if (char === CHAR_WATER_ARC) {
          const N = isWatery(rowIndex - 1, colIndex);
          const S = isWatery(rowIndex + 1, colIndex);
          const W = isWatery(rowIndex, colIndex - 1);
          const E = isWatery(rowIndex, colIndex + 1);
          let orientation: 'NW' | 'NE' | 'SW' | 'SE' = 'NW';
          if (N && W) orientation = 'NW';
          else if (N && E) orientation = 'NE';
          else if (S && W) orientation = 'SW';
          else if (S && E) orientation = 'SE';
          waterArcs.push({ x, y, orientation });
        } else if (char === CHAR_SAND) {
          sandTiles.push({ x: colIndex * TILE_SIZE, y: rowIndex * TILE_SIZE });
        } else if (char === CHAR_SAND_ARC) {
          const N = isSandy(rowIndex - 1, colIndex);
          const S = isSandy(rowIndex + 1, colIndex);
          const W = isSandy(rowIndex, colIndex - 1);
          const E = isSandy(rowIndex, colIndex + 1);
          let orientation: 'NW' | 'NE' | 'SW' | 'SE' = 'NW';
          if (N && W) orientation = 'NW';
          else if (N && E) orientation = 'NE';
          else if (S && W) orientation = 'SW';
          else if (S && E) orientation = 'SE';
          sandArcs.push({ x, y, orientation });
        } else if (/[1-9]/.test(char)) {
          portals.push({ x: x + TILE_SIZE/2, y: y + TILE_SIZE/2, id: char });
        }
      }
    });

    wallsRef.current = walls;
    decorationsRef.current = decorations;
    boostTilesRef.current = boostTiles;
    waterTilesRef.current = waterTiles;
    waterArcsRef.current = waterArcs;
    sandTilesRef.current = sandTiles;
    sandArcsRef.current = sandArcs;
    portalsRef.current = portals;
    holeRef.current = hole;
    startPosRef.current = start;
    
    if (dimensions.width > 0) {
      offsetRef.current = calculateLayout(dimensions.width, dimensions.height);
    }

    ballRef.current = {
      pos: { ...start },
      vel: { x: 0, y: 0 },
      radius: BALL_RADIUS,
      isMoving: false,
      sunk: false,
      teleportTimer: 0
    };

    // Calculate initial angle from ball to hole for the Touch Assist overlay
    const dx = hole.x - start.x;
    const dy = hole.y - start.y;
    setTouchAngle(Math.atan2(dy, dx));
  }, [level, calculateLayout]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cssScale = physicalScaleRef.current / dpr;
    
    const x = (clientX - rect.left - offsetRef.current.x) / cssScale;
    const y = (clientY - rect.top - offsetRef.current.y) / cssScale;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ballRef.current || ballRef.current.sunk || ballRef.current.teleportTimer > 0) return;
    if (!ALLOW_HIT_WHILE_MOVING && ballRef.current.isMoving) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const { x, y } = getCanvasCoords(clientX, clientY);

    setIsAiming(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isAiming || !dragStart || !canvasRef.current) return;
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const { x, y } = getCanvasCoords(clientX, clientY);
    setDragCurrent({ x, y });

    // Sync touch controller state as dragging is performed in traditional mode
    const dx = dragStart.x - x;
    const dy = dragStart.y - y;
    const rawLen = Math.sqrt(dx*dx + dy*dy);
    if (rawLen > 2) {
      let angle = Math.atan2(dy, dx);
      while (angle < 0) angle += Math.PI * 2;
      while (angle >= Math.PI * 2) angle -= Math.PI * 2;
      const powerPct = Math.min(100, Math.round((rawLen * POWER_MULTIPLIER / MAX_POWER) * 100));
      setTouchAngle(angle);
      setTouchPower(powerPct);
    }
  }, [isAiming, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (!isAiming || !dragStart || !dragCurrent || !ballRef.current) {
        setIsAiming(false);
        return;
    }
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const power = Math.sqrt(dx*dx + dy*dy) * POWER_MULTIPLIER;
    
    if (power > 1) { 
        const angle = Math.atan2(dy, dx);
        const cappedPower = Math.min(power, MAX_POWER);
        ballRef.current.vel.x = Math.cos(angle) * cappedPower;
        ballRef.current.vel.y = Math.sin(angle) * cappedPower;
        ballRef.current.isMoving = true;
        playForeground(getPath("/media/audio/sfx/minigolf/putt.mp3"));
        onStroke();
    }
    setIsAiming(false);
    setDragStart(null);
    setDragCurrent(null);
  }, [isAiming, dragStart, dragCurrent, onStroke]);

  // Touch Controller Helpers
  const adjustAngle = (deltaInRadians: number) => {
    setTouchAngle(prev => {
      let next = prev + deltaInRadians;
      while (next < 0) next += Math.PI * 2;
      while (next >= Math.PI * 2) next -= Math.PI * 2;
      return next;
    });
  };

  const handleDialMouseDown = (clientX: number) => {
    setDialDragging(true);
    dialDragStartRef.current = clientX;
    dialAngleStartRef.current = touchAngle;
  };

  const handleDialMouseMove = (clientX: number) => {
    if (!dialDragging) return;
    const deltaX = clientX - dialDragStartRef.current;
    const sens = Math.PI / 185; // 185 pixels = 180 degrees rotation sensitivity
    let nextAngle = dialAngleStartRef.current - deltaX * sens; // inverted drag feel is more intuitive
    while (nextAngle < 0) nextAngle += Math.PI * 2;
    while (nextAngle >= Math.PI * 2) nextAngle -= Math.PI * 2;
    setTouchAngle(nextAngle);
  };

  const handleTouchShoot = () => {
    const b = ballRef.current;
    if (!b || b.sunk || b.isMoving || b.teleportTimer > 0) return;

    // Calculate simulated slingshot pull parameters
    const dragDistance = (touchPower / 100) * (MAX_POWER / POWER_MULTIPLIER);
    const dx = Math.cos(touchAngle) * dragDistance;
    const dy = Math.sin(touchAngle) * dragDistance;
    const power = Math.sqrt(dx*dx + dy*dy) * POWER_MULTIPLIER;

    if (power > 1) {
        const cappedPower = Math.min(power, MAX_POWER);
        b.vel.x = Math.cos(touchAngle) * cappedPower;
        b.vel.y = Math.sin(touchAngle) * cappedPower;
        b.isMoving = true;
        playForeground(getPath("/media/audio/sfx/minigolf/putt.mp3"));
        onStroke();
    }
  };

  useEffect(() => {
    if (isAiming) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove);
        window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isAiming, handleMouseMove, handleMouseUp]);

  const triggerConfetti = useCallback(() => {
    const h = holeRef.current;
    if (!h) return;
    const colors = ['#ff2a2a', '#ff9f2a', '#ffea2a', '#2aff2a', '#2affea', '#2a2aff', '#ea2aff', '#ff2aea', '#00f0ff', '#ff00ff'];
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
    
    const newParticles: ConfettiParticle[] = [];
    for (let i = 0; i < 80; i++) {
        const angle = Math.PI * 1.2 + Math.random() * Math.PI * 0.6; // upward arc
        const speed = 4 + Math.random() * 8;
        newParticles.push({
            x: h.x,
            y: h.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // upward velocity bias
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: -0.1 + Math.random() * 0.2,
            opacity: 1,
            shape: shapes[Math.floor(Math.random() * shapes.length)]
        });
    }
    confettiParticlesRef.current = newParticles;
  }, []);

  const update = useCallback(() => {
    // Update confetti particles
    const particles = confettiParticlesRef.current;
    if (particles.length > 0) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.015; // fade out
        if (p.opacity <= 0 || p.y > dimensions.height + 50) {
          particles.splice(i, 1);
        }
      }
    }

    const b = ballRef.current;
    if (!b || b.sunk) return;

    if (portalCooldownRef.current > 0) {
      portalCooldownRef.current--;
    }

    // Handle Teleportation Delay
    if (b.teleportTimer > 0) {
      b.teleportTimer--;
      if (b.teleportTimer === 0 && pendingTeleportRef.current) {
        playForeground(getPath("/media/audio/sfx/minigolf/outofholehole.mp3"));

        const { targetPortal, exitConfig } = pendingTeleportRef.current;
        b.pos.x = targetPortal.x;
        b.pos.y = targetPortal.y;
        lastExitedPortalRef.current = targetPortal;
        portalCooldownRef.current = 60;
        
        if (exitConfig) {
          const currentSpeed = Math.sqrt(b.vel.x**2 + b.vel.y**2);
          const newSpeed = currentSpeed * exitConfig.boost;
          const rad = (exitConfig.angle * Math.PI) / 180;
          b.vel.x = Math.cos(rad) * newSpeed;
          b.vel.y = Math.sin(rad) * newSpeed;
        }
        b.isMoving = true;
        pendingTeleportRef.current = null;
      }
      return; // Ball is "frozen" during teleport
    }

    // Update glowing bumper ripples / shockwaves
    shockwavesRef.current = shockwavesRef.current
      .map(s => ({
        ...s,
        r: s.r + (s.maxR - s.r) * 0.14,
        alpha: s.alpha - 0.04
      }))
      .filter(s => s.alpha > 0);

    decorationsRef.current.forEach(d => {
      if (d.type === 'BOUNCY_PAD') {
        if (d.scale !== undefined && d.targetScale !== undefined) {
          d.scale += (d.targetScale - d.scale) * 0.15;
          if (Math.abs(d.scale - 1) < 0.01) d.scale = 1;
        }
      }

      if (d.type === 'TREX' && d.pauseTimer !== undefined && d.pauseTimer > 0) {
        d.pauseTimer--;
        if (d.pauseTimer > 30) {
          b.pos.x = d.pos.x;
          b.pos.y = d.pos.y - 10;
          b.vel.x = 0;
          b.vel.y = 0;
          b.isMoving = false;
        }
        if (d.pauseTimer === 30) {
          b.vel.y = 25;
          b.vel.x = d.originalVel!.x * 3;
          b.isMoving = true;
          playForeground(getPath("/media/audio/sfx/minigolf/putt.mp3"))
        }
        if (d.pauseTimer === 0 && d.originalVel) {
          d.vel = { ...d.originalVel };
          d.originalVel = undefined;
        }
      }

      if (d.vel && (d.vel.x !== 0 || d.vel.y !== 0)) {
        d.pos.x += d.vel.x;
        d.pos.y += d.vel.y;
        wallsRef.current.forEach(w => {
          const closestX = Math.max(w.x, Math.min(d.pos.x, w.x + w.w));
          const closestY = Math.max(w.y, Math.min(d.pos.y, w.y + w.h));
          const dx = d.pos.x - closestX;
          const dy = d.pos.y - closestY;
          const distSq = dx * dx + dy * dy;
          if (distSq < (d.radius * 0.8) ** 2) {
            if (d.vel!.x !== 0) { d.vel!.x *= -1; d.pos.x += d.vel!.x; }
            if (d.vel!.y !== 0) { d.vel!.y *= -1; d.pos.y += d.vel!.y; }
          }
        });
        
        const gridH = level.grid.length * TILE_SIZE;
        const gridW = level.grid[0].length * TILE_SIZE;
        if (d.pos.y < 0 || d.pos.y > gridH) d.vel.y *= -1;
        if (d.pos.x < 0 || d.pos.x > gridW) d.vel.x *= -1;
      }
    });

    // Android to Android collision detection
    for (let i = 0; i < decorationsRef.current.length; i++) {
        const d1 = decorationsRef.current[i];
        if (d1.type !== 'ANDROID' || !d1.vel) continue;

        for (let j = i + 1; j < decorationsRef.current.length; j++) {
            const d2 = decorationsRef.current[j];
            if (d2.type !== 'ANDROID' || !d2.vel) continue;

            const dx = d1.pos.x - d2.pos.x;
            const dy = d1.pos.y - d2.pos.y;
            const distSq = dx * dx + dy * dy;
            const minDist = d1.radius + d2.radius;

            if (distSq < minDist * minDist) {
                // Reverse both androids
                d1.vel.x *= -1;
                d1.vel.y *= -1;
                d2.vel.x *= -1;
                d2.vel.y *= -1;

                // Simple separation to avoid sticking
                const dist = Math.sqrt(distSq);
                const overlap = (minDist - dist) / 2;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                d1.pos.x += nx * overlap;
                d1.pos.y += ny * overlap;
                d2.pos.x -= nx * overlap;
                d2.pos.y -= ny * overlap;
            }
        }
    }

    if (!holeRef.current) return;

    let appliedFriction = FRICTION;
    
    const gridWidth = level.grid[0].length * TILE_SIZE;
    const gridHeight = level.grid.length * TILE_SIZE;

    // Check Android collisions even when ball is stationary
    decorationsRef.current.forEach(d => {
        if (d.type === 'ANDROID' && d.vel) {
            const dx = b.pos.x - d.pos.x;
            const dy = b.pos.y - d.pos.y;
            const distSq = dx * dx + dy * dy;
            const minDist = b.radius + d.radius * 0.6;
            
            if (distSq < minDist * minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;
                
                // Calculate new position after push
                let newX = b.pos.x + nx * (minDist - dist);
                let newY = b.pos.y + ny * (minDist - dist);
                
                // Clamp to boundaries
                newX = Math.max(b.radius, Math.min(gridWidth - b.radius, newX));
                newY = Math.max(b.radius, Math.min(gridHeight - b.radius, newY));
                
                // Apply the clamped position
                b.pos.x = newX;
                b.pos.y = newY;
                
                // Transfer android's velocity to the ball
                b.vel.x = d.vel.x * 2;
                b.vel.y = d.vel.y * 2;
                b.isMoving = true;
                
                playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
            }
        }
    });

    if (b.isMoving) {
        // Spawn trail particles based on equipped trail
        const currentSpeed = Math.hypot(b.vel.x, b.vel.y);
        if (currentSpeed > 0.3) {
            const activeTrail = TRAILS_STORE_ITEMS.find(t => t.id === equippedTrailId) || TRAILS_STORE_ITEMS[0];
            const spawnCount = Math.min(3, Math.max(1, Math.floor(currentSpeed / 3.5)));
            for (let i = 0; i < spawnCount; i++) {
                const jitterAngle = Math.random() * Math.PI * 2;
                const jitterDist = Math.random() * (b.radius * 0.7);
                trailParticlesRef.current.push({
                    x: b.pos.x + Math.cos(jitterAngle) * jitterDist,
                    y: b.pos.y + Math.sin(jitterAngle) * jitterDist,
                    vx: -b.vel.x * 0.14 + (Math.random() - 0.5) * 1.5,
                    vy: -b.vel.y * 0.14 + (Math.random() - 0.5) * 1.5,
                    color: activeTrail.color,
                    secondaryColor: activeTrail.secondaryColor,
                    size: (activeTrail.size || 3.5) * (0.8 + Math.random() * 0.5),
                    alpha: 0.95,
                    maxLife: 24,
                    life: 0,
                    type: activeTrail.particleType,
                    glow: activeTrail.glowColor,
                });
            }
        }

        const SUBSTEPS = 12;
        let collided = false;
        
        for (let i = 0; i < SUBSTEPS; i++) {
            b.pos.x += b.vel.x / SUBSTEPS;
            b.pos.y += b.vel.y / SUBSTEPS;
            
            // Boundary checking - keep ball within gameboard
            if (b.pos.x - b.radius < 0) {
                b.pos.x = b.radius;
                b.vel.x = -b.vel.x * 0.8;
                playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
            } else if (b.pos.x + b.radius > gridWidth) {
                b.pos.x = gridWidth - b.radius;
                b.vel.x = -b.vel.x * 0.8;
                playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
            }
            
            if (b.pos.y - b.radius < 0) {
                b.pos.y = b.radius;
                b.vel.y = -b.vel.y * 0.8;
                playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
            } else if (b.pos.y + b.radius > gridHeight) {
                b.pos.y = gridHeight - b.radius;
                b.vel.y = -b.vel.y * 0.8;
                playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
            }

            const speed = Math.sqrt(b.vel.x * b.vel.x + b.vel.y * b.vel.y);
            const SINK_THRESHOLD = 6.0;

            // Check if on sand (applies extra friction)
            sandTilesRef.current.forEach(t => {
                if (b.pos.x >= t.x && b.pos.x <= t.x + TILE_SIZE &&
                    b.pos.y >= t.y && b.pos.y <= t.y + TILE_SIZE) {
                    appliedFriction = SAND_FRICTION;
                }
            });

            sandArcsRef.current.forEach(t => {
              let cx = t.x, cy = t.y;
              if (t.orientation === 'NE') cx = t.x + TILE_SIZE;
              else if (t.orientation === 'SW') cy = t.y + TILE_SIZE;
              else if (t.orientation === 'SE') { cx = t.x + TILE_SIZE; cy = t.y + TILE_SIZE; }

              const dx = b.pos.x - cx;
              const dy = b.pos.y - cy;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < TILE_SIZE && 
                  b.pos.x >= t.x && b.pos.x <= t.x + TILE_SIZE &&
                  b.pos.y >= t.y && b.pos.y <= t.y + TILE_SIZE) {
                  appliedFriction = SAND_FRICTION;
              }
            });

            // Portal Logic - skip all portals during cooldown
            if (portalCooldownRef.current === 0) {
              for (const p of portalsRef.current) {
                const dx = b.pos.x - p.x;
                const dy = b.pos.y - p.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < (HOLE_RADIUS * 1.5) ** 2) {
                  const sibling = portalsRef.current.find(sp => sp.id === p.id && sp !== p);
                  if (sibling) {
                    // Enter portal: Disappear and wait
                    b.teleportTimer = TELEPORT_TIME;
                    b.isMoving = false;
                    
                    const pIdx = parseInt(p.id) - 1;
                    pendingTeleportRef.current = {
                      targetPortal: sibling,
                      exitConfig: level.portalExitConfigs ? level.portalExitConfigs[pIdx] : undefined
                    };
                    playForeground(getPath("/media/audio/sfx/minigolf/intohole.mp3"));
                    break;
                  }
                }
              }
            }
            if (b.teleportTimer > 0) break; // Stop substepping if we just entered a portal

            // Water Tile Hazard Logic
            waterTilesRef.current.forEach(t => {
                if (b.pos.x >= t.x && b.pos.x <= t.x + TILE_SIZE &&
                    b.pos.y >= t.y && b.pos.y <= t.y + TILE_SIZE) {
                    if (speed < SINK_THRESHOLD) {
                      // TODO (jsylvester): use splash audio (pending)
                        b.pos.x = startPosRef.current!.x;
                        b.pos.y = startPosRef.current!.y;
                        b.vel.x = 0; b.vel.y = 0; b.isMoving = false;
                        onStroke(); 
                    }
                }
            });

            // Water Arc Hazard Logic
            waterArcsRef.current.forEach(t => {
                let cx = t.x, cy = t.y;
                if (t.orientation === 'NE') cx = t.x + TILE_SIZE;
                else if (t.orientation === 'SW') cy = t.y + TILE_SIZE;
                else if (t.orientation === 'SE') { cx = t.x + TILE_SIZE; cy = t.y + TILE_SIZE; }

                const dx = b.pos.x - cx;
                const dy = b.pos.y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < TILE_SIZE && 
                    b.pos.x >= t.x && b.pos.x <= t.x + TILE_SIZE &&
                    b.pos.y >= t.y && b.pos.y <= t.y + TILE_SIZE) {
                    if (speed < SINK_THRESHOLD) {
                        // TODO (jsylvester): use splash audio (pending)
                        b.pos.x = startPosRef.current!.x;
                        b.pos.y = startPosRef.current!.y;
                        b.vel.x = 0; b.vel.y = 0; b.isMoving = false;
                        onStroke();
                    }
                }
            });

            // Boost Tile Logic
            boostTilesRef.current.forEach(t => {
                if (b.pos.x >= t.x && b.pos.x <= t.x + TILE_SIZE &&
                    b.pos.y >= t.y && b.pos.y <= t.y + TILE_SIZE) {
                    b.vel.x += t.dx * 0.4;
                    b.vel.y += t.dy * 0.4;
                    const speedSq = b.vel.x**2 + b.vel.y**2;
                    if (speedSq > 30 * 30) {
                      const sp = Math.sqrt(speedSq);
                      b.vel.x = (b.vel.x / sp) * 30;
                      b.vel.y = (b.vel.y / sp) * 30;
                    }
                    b.isMoving = true;
                }
            });

            wallsRef.current.forEach(w => {
                if (w.type === 'SQUARE') {
                  const closestX = Math.max(w.x, Math.min(b.pos.x, w.x + w.w));
                  const closestY = Math.max(w.y, Math.min(b.pos.y, w.y + w.h));
                  const dx = b.pos.x - closestX;
                  const dy = b.pos.y - closestY;
                  const distSq = dx * dx + dy * dy;

                  if (distSq < b.radius * b.radius) {
                      const dist = Math.sqrt(distSq) || 0.001;
                      const normalX = dx / dist;
                      const normalY = dy / dist;

                      const dot = b.vel.x * normalX + b.vel.y * normalY;
                      if (dot < 0) {
                          // Perfectly resolve the overlap by snap-positioning the ball outward
                          b.pos.x = closestX + normalX * b.radius;
                          b.pos.y = closestY + normalY * b.radius;

                          // Vector reflection: v' = v - 1.8 * (v . n) * n (Elasticity coefficient 0.8)
                          b.vel.x = b.vel.x - 1.8 * dot * normalX;
                          b.vel.y = b.vel.y - 1.8 * dot * normalY;
                          
                          playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
                          collided = true;
                      }
                  }
                } else if (w.type === 'ARC' || w.type === 'INSIDE_ARC') {
                  let cx = w.x, cy = w.y;
                  if (w.orientation === 'NE') cx = w.x + w.w;
                  else if (w.orientation === 'SW') cy = w.y + w.h;
                  else if (w.orientation === 'SE') { cx = w.x + w.w; cy = w.y + w.h; }

                  const dx = b.pos.x - cx;
                  const dy = b.pos.y - cy;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const radius = TILE_SIZE;

                  if (w.type === 'ARC') {
                    if (dist < radius + b.radius && dist > radius - b.radius) {
                      if (b.pos.x >= w.x - b.radius && b.pos.x <= w.x + w.w + b.radius &&
                          b.pos.y >= w.y - b.radius && b.pos.y <= w.y + w.h + b.radius) {
                        const normalX = dx / dist;
                        const normalY = dy / dist;
                        
                        const dot = b.vel.x * normalX + b.vel.y * normalY;
                        if (dot < 0) {
                          const overlap = (radius + b.radius) - dist;
                          b.pos.x += normalX * overlap;
                          b.pos.y += normalY * overlap;
                          
                          playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
                          b.vel.x = (b.vel.x - 1.8 * dot * normalX);
                          b.vel.y = (b.vel.y - 1.8 * dot * normalY);
                        }
                      }
                    }
                  } 
                  else if (w.type === 'INSIDE_ARC') {
                    if (dist > radius - b.radius) {
                      if (b.pos.x >= w.x - b.radius && b.pos.x <= w.x + w.w + b.radius &&
                          b.pos.y >= w.y - b.radius && b.pos.y <= w.y + w.h + b.radius) {
                        const normalX = -dx / dist;
                        const normalY = -dy / dist;
                        
                        const dot = b.vel.x * normalX + b.vel.y * normalY;
                        if (dot < 0) {
                          const overlap = dist - (radius - b.radius);
                          b.pos.x += normalX * overlap;
                          b.pos.y += normalY * overlap;
                          
                          playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
                          b.vel.x = (b.vel.x - 1.8 * dot * normalX);
                          b.vel.y = (b.vel.y - 1.8 * dot * normalY);
                        }
                      }
                    }
                  }
                }
            });

            decorationsRef.current.forEach(d => {
                const dx = b.pos.x - d.pos.x;
                const dy = b.pos.y - d.pos.y;
                const distSq = dx * dx + dy * dy;
                
                if (d.type === 'BOUNCY_PAD') {
                  const minDist = b.radius + d.radius;
                  if (distSq < minDist * minDist && distSq > 0) {
                      const dist = Math.sqrt(distSq);
                      const nx = dx / dist;
                      const ny = dy / dist;
                      const boost = 18;
                      b.vel.x = nx * boost;
                      b.vel.y = ny * boost;
                      b.pos.x = d.pos.x + nx * (minDist + 2);
                      b.pos.y = d.pos.y + ny * (minDist + 2);
                      b.isMoving = true;
                      d.scale = 1.4;
                      d.targetScale = 1;

                      // Trigger stunning glowing retro concentric ripples
                      shockwavesRef.current.push({
                        x: d.pos.x,
                        y: d.pos.y,
                        r: 8,
                        maxR: 54,
                        color: '#db5641',
                        alpha: 1.0
                      });
                      shockwavesRef.current.push({
                        x: d.pos.x,
                        y: d.pos.y,
                        r: 4,
                        maxR: 38,
                        color: '#288a7c',
                        alpha: 0.8
                      });

                      playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
                  }
                } else if (d.type === 'TREX') {
                  const minDist = b.radius + d.radius * 0.6;
                  if (distSq < minDist * minDist && distSq > 0 && (!d.pauseTimer || d.pauseTimer === 0)) {
                      d.pauseTimer = 70; 
                      d.originalVel = { ...d.vel! };
                      d.vel = { x: 0, y: 0 };
                      b.pos.x = d.pos.x;
                      b.pos.y = d.pos.y;
                      b.vel.x = 0;
                      b.vel.y = 0;
                      b.isMoving = false;
                      playForeground(getPath("/media/audio/sfx/minigolf/hitwall.mp3"));
                  }
                }
            });
        }

        const h = holeRef.current;
        const dx = b.pos.x - h.x;
        const dy = b.pos.y - h.y;
        if (Math.sqrt(dx*dx + dy*dy) < HOLE_RADIUS) {
            const sp = Math.sqrt(b.vel.x**2 + b.vel.y**2);
            if (sp < 15) {
                b.pos.x = h.x; b.pos.y = h.y;
                b.vel.x = 0; b.vel.y = 0;
                b.isMoving = false; b.sunk = true;
                playForeground(getPath("/media/audio/sfx/minigolf/intohole.mp3"));
                if (strokes === 1) {
                    triggerConfetti();
                }
                onHole();
            }
        }

        b.vel.x *= appliedFriction;
        b.vel.y *= appliedFriction;
        if (Math.abs(b.vel.x) < VELOCITY_THRESHOLD && Math.abs(b.vel.y) < VELOCITY_THRESHOLD) {
            b.vel.x = 0; b.vel.y = 0; b.isMoving = false;
        }
    }

    // Update active trail particles
    trailParticlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
    });
    trailParticlesRef.current = trailParticlesRef.current.filter(p => p.life < p.maxLife);

    // Sync isBallMoving React state at physics boundary triggers
    if (b) {
      if (b.isMoving !== isBallMoving) {
        setIsBallMoving(b.isMoving);
      }
    }
  }, [onHole, level.grid, onStroke, isBallMoving, strokes, dimensions.height, triggerConfetti, equippedTrailId]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ballRef.current || !holeRef.current || dimensions.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(dimensions.width * dpr);
    canvas.height = Math.floor(dimensions.height * dpr);

    const isFloor = (r: number, c: number) => {
      if (r < 0 || r >= level.grid.length || c < 0 || c >= level.grid[0].length) return false;
      const char = level.grid[r][c];
      return char !== CHAR_VOID && char !== CHAR_WALL && char !== CHAR_ARC && char !== CHAR_INSIDE_ARC;
    };

    const isCyber = level.color === COLORS.CYBER;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = isCyber ? COLORS.CYBER : COLORS.GRASS_DARK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(Math.floor(offsetRef.current.x * dpr), Math.floor(offsetRef.current.y * dpr));
    const finalScale = physicalScaleRef.current;
    ctx.scale(finalScale, finalScale);

    const gridWidth = level.grid[0].length * TILE_SIZE;
    const gridHeight = level.grid.length * TILE_SIZE;

    // Render deterministic atmospheric background stars/cosmic dust specks based on level id
    ctx.save();
    
    if (isCyber) {
        // Draw neon cyan cyber grid
        ctx.strokeStyle = COLORS.CYBER_GRID + '44'; // 44 hex for alpha
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        for (let x = -canvas.width/finalScale; x < canvas.width/finalScale * 2; x += TILE_SIZE) {
            ctx.moveTo(x, -canvas.height/finalScale);
            ctx.lineTo(x, canvas.height/finalScale * 2);
        }
        for (let y = -canvas.height/finalScale; y < canvas.height/finalScale * 2; y += TILE_SIZE) {
            ctx.moveTo(-canvas.width/finalScale, y);
            ctx.lineTo(canvas.width/finalScale * 2, y);
        }
        ctx.stroke();
    } else {
        const starSeed = level.id * 1234.56;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        for (let i = 0; i < 30; i++) {
            const starX = Math.abs(Math.sin(starSeed + i * 23.45)) * gridWidth;
            const starY = Math.abs(Math.cos(starSeed + i * 56.78)) * (gridHeight - TILE_SIZE * 1.5);
            const starRadius = 0.8 + Math.abs(Math.sin(starSeed * 2.3 + i * 11.2)) * 1.6;
            
            ctx.beginPath();
            ctx.arc(starX, starY, starRadius, 0, Math.PI * 2);
            ctx.fill();

            if (starRadius > 1.8) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.beginPath();
                ctx.arc(starX, starY, starRadius * 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
            }
        }
    }
    ctx.restore();

    // Create a clipping mask from all grass tiles and grass areas in arc walls
    ctx.save();
    ctx.beginPath();
    level.grid.forEach((row, r) => {
        row.split('').forEach((char, c) => {
            if (char !== CHAR_VOID && char !== CHAR_WALL && char !== CHAR_ARC && char !== CHAR_INSIDE_ARC && char !== CHAR_WATER_ARC ) {
               ctx.rect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        });
    });
    
    // Add grass areas from INSIDE_ARC and neighboring grass areas in ARC walls to the mask
    wallsRef.current.forEach(w => {
        const r = Math.floor(w.y / TILE_SIZE);
        const c = Math.floor(w.x / TILE_SIZE);
        
        if (w.type === 'INSIDE_ARC') {
          let cx = w.x, cy = w.y;
          let startAngle = 0;
          if (w.orientation === 'NE') { cx = w.x + w.w; startAngle = Math.PI/2; }
          else if (w.orientation === 'SW') { cy = w.y + w.h; startAngle = 1.5*Math.PI; }
          else if (w.orientation === 'SE') { cx = w.x + w.w; cy = w.y + w.h; startAngle = Math.PI; }
          
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, TILE_SIZE, startAngle, startAngle + Math.PI/2);
          ctx.lineTo(cx, cy);
        } else if (w.type === 'ARC') {
          const hasFloorNeighbor = isFloor(r-1, c) || isFloor(r+1, c) || isFloor(r, c-1) || isFloor(r, c+1);
          if (hasFloorNeighbor) {
            ctx.rect(w.x, w.y, w.w, w.h);
          }
        }
    });
    
    ctx.clip();

    // Draw a hand-painted watercolor paper gradient for the grass surface of the course
    const isHorizontal = gridWidth > gridHeight;
    const grad = isHorizontal 
      ? ctx.createLinearGradient(0, 0, gridWidth, 0)
      : ctx.createLinearGradient(0, 0, 0, gridHeight);
    
    // Warm oatmeal/vanilla watercolor spectrum inspired by Hecho a Mano artwork
    // Or deep synthwave grid for cyber levels
    if (isCyber) {
        grad.addColorStop(0, '#110b1a');
        grad.addColorStop(0.5, '#1e1133');
        grad.addColorStop(1, '#2c1544');
    } else {
        grad.addColorStop(0, '#f4ece2');
        grad.addColorStop(0.5, '#ebdcc9');
        grad.addColorStop(1, '#ebd1b5');
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, gridWidth, gridHeight);
    
    // Draw cyber grid on floor surface if requested
    if (isCyber) {
        ctx.save();
        ctx.strokeStyle = COLORS.CYBER_NEON + '22';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= gridWidth; x += TILE_SIZE) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, gridHeight);
        }
        for (let y = 0; y <= gridHeight; y += TILE_SIZE) {
            ctx.moveTo(0, y);
            ctx.lineTo(gridWidth, y);
        }
        ctx.stroke();
        ctx.restore();
    }
    
    
    
    ctx.restore();

    // Render Sand Tiles
    sandTilesRef.current.forEach(t => {
      ctx.fillStyle = isCyber ? COLORS.CYBER_LASER + '55' : COLORS.SAND;
      ctx.fillRect(t.x, t.y, TILE_SIZE, TILE_SIZE);
    });

    // Render Sand Arc Tiles
    sandArcsRef.current.forEach(t => {
      ctx.fillStyle = isCyber ? COLORS.CYBER_LASER + '55' : COLORS.SAND;
      let cx = t.x, cy = t.y;
      let startAngle = 0;
      if (t.orientation === 'NE') { cx = t.x + TILE_SIZE; startAngle = Math.PI/2; }
      else if (t.orientation === 'SW') { cy = t.y + TILE_SIZE; startAngle = 1.5*Math.PI; }
      else if (t.orientation === 'SE') { cx = t.x + TILE_SIZE; cy = t.y + TILE_SIZE; startAngle = Math.PI; }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, TILE_SIZE, startAngle, startAngle + Math.PI/2);
      ctx.closePath();
      ctx.fill();
    });

    // Render Water Tiles
    waterTilesRef.current.forEach(t => {
      ctx.fillStyle = isCyber ? COLORS.CYBER_NEON : COLORS.WATER;
      ctx.fillRect(t.x, t.y, TILE_SIZE, TILE_SIZE);
    });

    // Render Water Arc Tiles
    waterArcsRef.current.forEach(t => {
      ctx.fillStyle = isCyber ? COLORS.CYBER_NEON : COLORS.WATER;
      let cx = t.x, cy = t.y;
      let startAngle = 0;
      if (t.orientation === 'NE') { cx = t.x + TILE_SIZE; startAngle = Math.PI/2; }
      else if (t.orientation === 'SW') { cy = t.y + TILE_SIZE; startAngle = 1.5*Math.PI; }
      else if (t.orientation === 'SE') { cx = t.x + TILE_SIZE; cy = t.y + TILE_SIZE; startAngle = Math.PI; }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, TILE_SIZE, startAngle, startAngle + Math.PI/2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, TILE_SIZE * 0.8, startAngle, startAngle + Math.PI/2);
      ctx.stroke();
    });

    // Render Portals (as holes with no numbers)
    portalsRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, HOLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#111111'; // Slightly darker hole to hint it's a portal
      ctx.fill();
      
      // Subtle rim
      ctx.strokeStyle = '#4B008288';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Render Boost Tiles
    boostTilesRef.current.forEach(t => {
      // 1. Draw solid teal base plate for the boost pad
      ctx.fillStyle = '#288a7c';
      ctx.fillRect(t.x, t.y, TILE_SIZE, TILE_SIZE);

      // 2. Beautiful glowing neon aura extending in the direction of the boost
      ctx.save();
      let glowGrad;
      if (t.dx === 1) { // Boost right
        glowGrad = ctx.createLinearGradient(t.x, t.y + TILE_SIZE/2, t.x + TILE_SIZE * 2.5, t.y + TILE_SIZE/2);
        glowGrad.addColorStop(0, 'rgba(40, 138, 124, 0.55)'); // teal glow
        glowGrad.addColorStop(1, 'rgba(40, 138, 124, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(t.x, t.y - 10, TILE_SIZE * 2.5, TILE_SIZE + 20);
      } else if (t.dy === -1) { // Boost up
        glowGrad = ctx.createLinearGradient(t.x + TILE_SIZE/2, t.y + TILE_SIZE, t.x + TILE_SIZE/2, t.y - TILE_SIZE * 2.5);
        glowGrad.addColorStop(0, 'rgba(40, 138, 124, 0.55)'); // teal glow
        glowGrad.addColorStop(1, 'rgba(40, 138, 124, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(t.x - 10, t.y - TILE_SIZE * 2.5, TILE_SIZE + 20, TILE_SIZE * 3.5);
      }
      ctx.restore();

      // 3. Draw fast-forward chevrons inside the tile
      ctx.save();
      ctx.translate(t.x + TILE_SIZE / 2, t.y + TILE_SIZE / 2);
      if (t.dx === 1) ctx.rotate(0);
      else if (t.dx === -1) ctx.rotate(Math.PI);
      else if (t.dy === -1) ctx.rotate(-Math.PI / 2);
      else if (t.dy === 1) ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < 2; i++) {
          const ox = -5 + i * 10;
          ctx.beginPath();
          ctx.moveTo(ox - 5, -8);
          ctx.lineTo(ox + 5, 0);
          ctx.lineTo(ox - 5, 8);
          ctx.stroke();
      }
      ctx.restore();
    });

    // Render Walls, Slopes, Cliff Hazards, and Procedural Grass contours
    wallsRef.current.forEach(w => {
        const r = Math.floor(w.y / TILE_SIZE);
        const c = Math.floor(w.x / TILE_SIZE);

        if (w.type === 'ARC') {
          // ARC: Draw the curved dark wall portion
          let cx = w.x, cy = w.y;
          let startAngle = 0;
          if (w.orientation === 'NE') { cx = w.x + w.w; startAngle = Math.PI/2; }
          else if (w.orientation === 'SW') { cy = w.y + w.h; startAngle = 1.5*Math.PI; }
          else if (w.orientation === 'SE') { cx = w.x + w.w; cy = w.y + w.h; startAngle = Math.PI; }

          ctx.fillStyle = COLORS.WALL;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, TILE_SIZE, startAngle, startAngle + Math.PI/2);
          ctx.closePath();
          ctx.fill();

          // Green Grass Turf on the curved slope edge facing the fairway
          ctx.strokeStyle = isCyber ? COLORS.CYBER_NEON : COLORS.GREEN;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy, TILE_SIZE, startAngle, startAngle + Math.PI/2);
          ctx.stroke();

          // Soft light-green grass highlights
          ctx.strokeStyle = COLORS.GRASS_HIGHLIGHT;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(cx, cy, TILE_SIZE + 1.2, startAngle, startAngle + Math.PI/2);
          ctx.stroke();
        } else if (w.type === 'INSIDE_ARC') {
          ctx.fillStyle = COLORS.WALL;
          ctx.beginPath();
          if (w.orientation === 'NW') {
            ctx.moveTo(w.x, w.y);
            ctx.lineTo(w.x + TILE_SIZE, w.y);
            ctx.arc(w.x + TILE_SIZE, w.y + TILE_SIZE, TILE_SIZE, 1.5 * Math.PI, Math.PI, true);
            ctx.lineTo(w.x, w.y);
          } else if (w.orientation === 'NE') {
            ctx.moveTo(w.x + TILE_SIZE, w.y);
            ctx.lineTo(w.x, w.y);
            ctx.arc(w.x, w.y + TILE_SIZE, TILE_SIZE, 1.5 * Math.PI, 0, false);
            ctx.lineTo(w.x + TILE_SIZE, w.y);
          } else if (w.orientation === 'SW') {
            ctx.moveTo(w.x, w.y + TILE_SIZE);
            ctx.lineTo(w.x + TILE_SIZE, w.y + TILE_SIZE);
            ctx.arc(w.x + TILE_SIZE, w.y, TILE_SIZE, 0.5 * Math.PI, Math.PI, false);
            ctx.lineTo(w.x, w.y + TILE_SIZE);
          } else if (w.orientation === 'SE') {
            ctx.moveTo(w.x + TILE_SIZE, w.y + TILE_SIZE);
            ctx.lineTo(w.x, w.y + TILE_SIZE);
            ctx.arc(w.x, w.y, TILE_SIZE, 0.5 * Math.PI, 0, true);
            ctx.lineTo(w.x + TILE_SIZE, w.y + TILE_SIZE);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // SQUARE walls: Fill with warm terracotta color
          ctx.fillStyle = COLORS.WALL;
          ctx.fillRect(w.x, w.y, w.w, w.h);

          // Cliff Edge Detection: Draw elegant orange-red/cream warning safety stripes on vertical wall faces bordering deep gaps
          const leftChar = (c > 0) ? level.grid[r][c - 1] : undefined;
          const rightChar = (c < level.grid[0].length - 1) ? level.grid[r][c + 1] : undefined;

          if (leftChar === ' ' || leftChar === CHAR_VOID) {
            // Draw Warning stripes on Left face of this wall tile
            ctx.save();
            ctx.fillStyle = '#db5641'; // Warm Terracotta/Red Alert
            ctx.fillRect(w.x, w.y, 6, TILE_SIZE);
            ctx.strokeStyle = '#faf6ee'; // Cream White lines
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let offset = -4; offset < TILE_SIZE; offset += 8) {
              ctx.moveTo(w.x, w.y + offset);
              ctx.lineTo(w.x + 6, w.y + offset + 6);
            }
            ctx.stroke();
            ctx.restore();
          }

          if (rightChar === ' ' || rightChar === CHAR_VOID) {
            // Draw Warning stripes on Right face of this wall tile
            ctx.save();
            ctx.fillStyle = '#db5641'; // Warm Terracotta/Red Alert
            ctx.fillRect(w.x + TILE_SIZE - 6, w.y, 6, TILE_SIZE);
            ctx.strokeStyle = '#faf6ee'; // Cream White lines
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let offset = -4; offset < TILE_SIZE; offset += 8) {
              ctx.moveTo(w.x + TILE_SIZE - 6, w.y + offset);
              ctx.lineTo(w.x + TILE_SIZE, w.y + offset + 6);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
    });

    // Procedural Top-ledge Flat Grass rendering on beautiful floating panels and platforms
    level.grid.forEach((row, r) => {
      row.split('').forEach((char, c) => {
        if (isFloor(r, c)) {
          const aboveChar = (r > 0) ? level.grid[r - 1][c] : undefined;
          if (aboveChar === CHAR_VOID || aboveChar === CHAR_WALL) {
            // Main Moss Green turf line or Neon pink for cyber
            ctx.fillStyle = isCyber ? COLORS.CYBER_NEON : COLORS.GREEN;
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, 6);
            
            // Light grass highlight to make it pop 3D out of the background
            ctx.fillStyle = isCyber ? '#ffffff' : COLORS.GRASS_HIGHLIGHT;
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, 1.8);
          }
        }
      });
    });
    // Render shadows for decorations
    // decorationsRef.current.forEach(d => {
    //   if (d.type === 'ANDROID' || d.type === 'TREX') {
    //     ctx.beginPath();
    //     ctx.ellipse(d.pos.x + 2, d.pos.y + 16, d.radius * 0.5, d.radius * 0.2, 0, 0, Math.PI * 2);
    //     ctx.fillStyle = COLORS.SHADOW;
    //     ctx.fill();
    //   }
    // });

    decorationsRef.current.forEach(d => {
        if (d.type === 'ANDROID') {
            if (USE_ANDROID_SVG) {
                ctx.save();
                ctx.translate(d.pos.x-13, d.pos.y-15);
                ctx.scale(1.5,1.5);
                const path = new Path2D(ICON_PATHS.android);
                ctx.fillStyle = COLORS.ANDROID;
                ctx.fill(path);
                ctx.restore();
            } else {
                ctx.fillStyle = COLORS.ANDROID; 
                ctx.beginPath(); ctx.arc(d.pos.x, d.pos.y - 5, 12, Math.PI, 0); ctx.fill();
                ctx.fillStyle = COLORS.GRASS_LIGHT;
                ctx.beginPath(); ctx.arc(d.pos.x - 5, d.pos.y - 10, 2, 0, Math.PI * 2); ctx.arc(d.pos.x + 5, d.pos.y - 10, 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = COLORS.ANDROID; 
                ctx.strokeStyle = COLORS.ANDROID; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(d.pos.x - 8, d.pos.y - 15); ctx.lineTo(d.pos.x - 12, d.pos.y - 22); ctx.moveTo(d.pos.x + 8, d.pos.y - 15); ctx.lineTo(d.pos.x + 12, d.pos.y - 22); ctx.stroke();
                ctx.beginPath(); ctx.rect(d.pos.x - 12, d.pos.y - 5, 24, 20); ctx.fill();
            }
        } else if (d.type === 'TREX') {
          if (USE_ANDROID_SVG) {
                const isFlipped = (d.vel && d.vel.x < 0) || (d.originalVel && d.originalVel.x < 0);
                ctx.save();
                ctx.translate(d.pos.x+2, d.pos.y);
                if (isFlipped) { ctx.scale(-1, 1); }
                ctx.scale(0.4,0.4);
                ctx.translate(-30,-35);
                const path = new Path2D(ICON_PATHS.dino);
                ctx.fillStyle = COLORS.ANDROID;
                ctx.fill(path);
                ctx.restore();
            } else {
              ctx.save();
              const isFlipped = (d.vel && d.vel.x < 0) || (d.originalVel && d.originalVel.x < 0);
              if (isFlipped) { ctx.translate(d.pos.x, d.pos.y); ctx.scale(-1, 1); ctx.translate(-d.pos.x, -d.pos.y); }
              ctx.fillStyle = COLORS.DINO;
              ctx.fillRect(d.pos.x - 10, d.pos.y - 5, 15, 15); ctx.fillRect(d.pos.x - 5, d.pos.y - 15, 15, 10);
              ctx.fillRect(d.pos.x - 8, d.pos.y + 10, 4, 6); ctx.fillRect(d.pos.x - 2, d.pos.y + 10, 4, 6);
              ctx.fillStyle = '#FFF'; ctx.fillRect(d.pos.x + 2, d.pos.y - 12, 2, 2);
              ctx.fillStyle = COLORS.DINO; ctx.fillRect(d.pos.x - 14, d.pos.y, 4, 4);
              if (d.pauseTimer && d.pauseTimer > 30) {
                ctx.fillStyle = '#FF4444';
                ctx.beginPath();
                ctx.arc(d.pos.x, d.pos.y - 20, 3, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
        } else if (d.type === 'BOUNCY_PAD') {
            ctx.save();
            ctx.translate(d.pos.x, d.pos.y);
            ctx.scale(d.scale || 1, d.scale || 1);

            const rotation = (Date.now() / 600) % (Math.PI * 2);

            // 1. Massive radiant neon orange and deep purple aura glow underneath
            const radGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
            radGlow.addColorStop(0, 'rgba(219, 86, 65, 0.45)'); // Sunset Orange-red
            radGlow.addColorStop(0.5, 'rgba(40, 138, 124, 0.25)'); // Retro Teal glow
            radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = radGlow;
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.fill();

            // 2. Drop shadow
            ctx.beginPath();
            ctx.ellipse(0, 5, 20, 20, 0, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.BOUNCY_PAD_SHADOW;
            ctx.fill();

            // 3. Beautiful physical casing of the bumper: industrial Outer Ring (Deep Slate)
            ctx.fillStyle = '#1b2330';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // 4. White glossy middle plate
            ctx.fillStyle = '#faf6ee';
            ctx.beginPath();
            ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
            ctx.fill();

            // 5. Rotating Warning Stripes inside the plate
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
            ctx.clip();
            ctx.rotate(rotation);
            ctx.strokeStyle = 'rgba(40, 138, 124, 0.35)'; // Soft rotating backdrop lines
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let offset = -40; offset < 40; offset += 10) {
              ctx.moveTo(offset, -25);
              ctx.lineTo(offset, 25);
            }
            ctx.stroke();
            ctx.restore();

            // 6. Glowing Active Coil Ring (Vivid neon teal-orange ring)
            ctx.strokeStyle = '#db5641'; // Active coil color
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();

            // 7. Core light/Sparkling Center Star (Dynamic pulsing & rotation)
            ctx.save();
            ctx.rotate(-rotation * 1.5);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            const points = 4;
            const outerRadius = 7;
            const innerRadius = 3;
            for (let i = 0; i < points * 2; i++) {
              const angle = (i * Math.PI) / points;
              const r = i % 2 === 0 ? outerRadius : innerRadius;
              ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // 8. Outer glass-glared edge
            const glassGrad = ctx.createLinearGradient(-15, -15, 15, 15);
            glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
            glassGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
            glassGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });

    // Draw expanding shockwaves of bumpers
    shockwavesRef.current.forEach(s => {
      ctx.save();
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    const h = holeRef.current;
    ctx.beginPath(); ctx.arc(h.x, h.y, HOLE_RADIUS, 0, Math.PI * 2); ctx.fillStyle = COLORS.BLACK; ctx.fill();
    
    // Draw Custom Trail Particles
    trailParticlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.glow;
      }

      if (p.type === 'flame' || p.type === 'phoenix' || p.type === 'dragon') {
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        radGrad.addColorStop(0, p.secondaryColor || '#ffff88');
        radGrad.addColorStop(0.6, p.color);
        radGrad.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (p.life / p.maxLife) * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'lightning' || p.type === 'circuit' || p.type === 'glitch') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (Math.random() - 0.5) * 8 + p.vx * 2, p.y + (Math.random() - 0.5) * 8 + p.vy * 2);
        ctx.stroke();
      } else if (p.type === 'laser') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
        ctx.stroke();
      } else if (p.type === 'star' || p.type === 'spark') {
        ctx.fillStyle = p.color;
        const spikes = 4;
        const outer = p.size;
        const inner = p.size * 0.4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const rot = (i * Math.PI) / spikes + (p.life * 0.15);
          const r = i % 2 === 0 ? outer : inner;
          ctx.lineTo(p.x + Math.cos(rot) * r, p.y + Math.sin(rot) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'rings' || p.type === 'portal') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + (p.life / p.maxLife) * 1.5), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'hearts') {
        ctx.fillStyle = p.color;
        ctx.font = `${Math.round(p.size * 2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', p.x, p.y);
      } else if (p.type === 'coins') {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (p.type === 'bubble' || p.type === 'ice') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (p.type === 'mesh') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const r = p.size * 1.6;
        const rot = p.life * 0.12;
        const a1 = rot;
        const a2 = rot + (Math.PI * 2) / 3;
        const a3 = rot + (Math.PI * 4) / 3;
        ctx.moveTo(p.x + Math.cos(a1) * r, p.y + Math.sin(a1) * r);
        ctx.lineTo(p.x + Math.cos(a2) * r, p.y + Math.sin(a2) * r);
        ctx.lineTo(p.x + Math.cos(a3) * r, p.y + Math.sin(a3) * r);
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = p.secondaryColor || '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'scribble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const r = p.size * 1.5;
        const t = p.life * 0.3;
        ctx.arc(p.x, p.y, r * 0.8, t, t + Math.PI * 1.4);
        ctx.stroke();
        if (p.secondaryColor) {
          ctx.fillStyle = p.secondaryColor;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(t) * r * 0.8, p.y + Math.sin(t) * r * 0.8, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - (p.life / p.maxLife) * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    const b = ballRef.current;
    // Don't render ball if it's currently "teleporting"
    if (!b.sunk && b.teleportTimer === 0) {
        const activeBall = BALLS_STORE_ITEMS.find(item => item.id === equippedBallId) || BALLS_STORE_ITEMS[0];

        // Draw drop shadow
        ctx.beginPath(); 
        ctx.ellipse(b.pos.x + 3, b.pos.y + 7, b.radius, b.radius * 0.6, 0, 0, Math.PI * 2); 
        ctx.fillStyle = COLORS.SHADOW; 
        ctx.fill();

        // If it's a glowing ball, apply canvas shadow properties
        if (activeBall.glowColor) {
            ctx.save();
            ctx.shadowBlur = b.radius * 1.2;
            ctx.shadowColor = activeBall.glowColor;
        }

        // Draw primary shell circle
        ctx.beginPath(); 
        ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
        
        // Handle ball material gradients based on specialType or custom IDs
        if (activeBall.specialType === 'gold' || activeBall.id === 'solid_gold') {
          const goldGrad = ctx.createRadialGradient(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 0, b.pos.x, b.pos.y, b.radius);
          goldGrad.addColorStop(0, '#fff9b5');
          goldGrad.addColorStop(0.5, '#ffd700');
          goldGrad.addColorStop(1, '#a67c00');
          ctx.fillStyle = goldGrad;
        } else if (activeBall.specialType === 'cosmic' || activeBall.id === 'cosmic_nebula' || activeBall.specialType === 'void') {
          const cosmicGrad = ctx.createRadialGradient(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 0, b.pos.x, b.pos.y, b.radius);
          cosmicGrad.addColorStop(0, activeBall.secondaryColor || '#bd5bf5');
          cosmicGrad.addColorStop(0.5, activeBall.color);
          cosmicGrad.addColorStop(1, '#020005');
          ctx.fillStyle = cosmicGrad;
        } else if (activeBall.specialType === 'fire' || activeBall.id === 'lava_fireball') {
          const fireGrad = ctx.createRadialGradient(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 0, b.pos.x, b.pos.y, b.radius);
          fireGrad.addColorStop(0, '#ffea73');
          fireGrad.addColorStop(0.5, activeBall.color);
          fireGrad.addColorStop(1, '#810000');
          ctx.fillStyle = fireGrad;
        } else if (activeBall.specialType === 'diamond' || activeBall.specialType === 'chrome') {
          const chromeGrad = ctx.createRadialGradient(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 0, b.pos.x, b.pos.y, b.radius);
          chromeGrad.addColorStop(0, '#ffffff');
          chromeGrad.addColorStop(0.4, activeBall.secondaryColor || '#e0f2fe');
          chromeGrad.addColorStop(1, activeBall.color);
          ctx.fillStyle = chromeGrad;
        } else if (activeBall.specialType === 'rainbow' || activeBall.specialType === 'aurora') {
          const rainbowGrad = ctx.createRadialGradient(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 0, b.pos.x, b.pos.y, b.radius);
          rainbowGrad.addColorStop(0, '#f43f5e');
          rainbowGrad.addColorStop(0.35, '#eab308');
          rainbowGrad.addColorStop(0.7, '#06b6d4');
          rainbowGrad.addColorStop(1, '#8b5cf6');
          ctx.fillStyle = rainbowGrad;
        } else if (activeBall.secondaryColor) {
          const dualGrad = ctx.createRadialGradient(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 0, b.pos.x, b.pos.y, b.radius);
          dualGrad.addColorStop(0, activeBall.secondaryColor);
          dualGrad.addColorStop(1, activeBall.color);
          ctx.fillStyle = dualGrad;
        } else {
          ctx.fillStyle = activeBall.color;
        }
        ctx.fill();

        if (activeBall.glowColor) {
            ctx.restore();
        }

        // Add dimple/gloss texture effect
        ctx.save();
        ctx.globalAlpha = 0.11;
        ctx.strokeStyle = activeBall.textColor === '#ffffff' ? '#000000' : '#ffffff';
        ctx.lineWidth = 0.5;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const dx = Math.cos(angle) * (b.radius * 0.52);
          const dy = Math.sin(angle) * (b.radius * 0.52);
          ctx.beginPath();
          ctx.arc(b.pos.x + dx, b.pos.y + dy, b.radius * 0.11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Pattern overlays
        if (activeBall.specialType === '8ball' || activeBall.id === '8_ball') {
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.fillStyle = '#1a1a1a';
          ctx.font = `bold ${Math.round(b.radius * 0.65)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('8', b.pos.x, b.pos.y + 0.5);
        }

        if (activeBall.specialType === 'donut' || activeBall.id === 'glazed_donut') {
          // Donut hole
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, b.radius * 0.28, 0, Math.PI * 2);
          ctx.fillStyle = '#f2edd9';
          ctx.fill();
          ctx.strokeStyle = '#8a4f1d';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Sprinkles
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath(); ctx.moveTo(b.pos.x - b.radius * 0.45, b.pos.y + b.radius * 0.1); ctx.lineTo(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.1); ctx.stroke();
          ctx.strokeStyle = '#eab308';
          ctx.beginPath(); ctx.moveTo(b.pos.x + b.radius * 0.35, b.pos.y + b.radius * 0.25); ctx.lineTo(b.pos.x + b.radius * 0.2, b.pos.y + b.radius * 0.38); ctx.stroke();
          ctx.strokeStyle = '#a855f7';
          ctx.beginPath(); ctx.moveTo(b.pos.x - b.radius * 0.1, b.pos.y - b.radius * 0.45); ctx.lineTo(b.pos.x + b.radius * 0.1, b.pos.y - b.radius * 0.4); ctx.stroke();
        }

        if (activeBall.pattern === 'stripe') {
          ctx.save();
          ctx.strokeStyle = activeBall.secondaryColor || '#1d1916';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          const angleRad = 25 * Math.PI / 180;
          const cosA = Math.cos(angleRad);
          const sinA = Math.sin(angleRad);
          ctx.moveTo(b.pos.x - b.radius * cosA, b.pos.y - b.radius * sinA);
          ctx.lineTo(b.pos.x + b.radius * cosA, b.pos.y + b.radius * sinA);
          ctx.stroke();
          ctx.restore();
        }

        if (activeBall.pattern === 'dual_ring') {
          ctx.save();
          ctx.strokeStyle = activeBall.secondaryColor || '#e35112';
          ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, b.radius * 0.65, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = activeBall.textColor || '#1a1a1a';
          ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, b.radius * 0.76, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }

        if (activeBall.pattern === 'truvis') {
          ctx.save();
          ctx.fillStyle = activeBall.secondaryColor || '#db5641';
          const rSub = b.radius * 0.28;
          const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
          angles.forEach(ang => {
            const tx = b.pos.x + Math.cos(ang) * (b.radius * 0.65);
            const ty = b.pos.y + Math.sin(ang) * (b.radius * 0.65);
            ctx.beginPath();
            ctx.arc(tx, ty, rSub, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, rSub * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (activeBall.pattern === 'dots' || activeBall.pattern === 'stars') {
          ctx.save();
          ctx.fillStyle = activeBall.secondaryColor || '#ffffff';
          const dotCount = 5;
          for (let i = 0; i < dotCount; i++) {
            const ang = (i * Math.PI * 2) / dotCount;
            const dx = Math.cos(ang) * (b.radius * 0.55);
            const dy = Math.sin(ang) * (b.radius * 0.55);
            ctx.beginPath();
            ctx.arc(b.pos.x + dx, b.pos.y + dy, b.radius * 0.16, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        if (activeBall.pattern === 'number' || activeBall.id === 'pro_v1') {
          ctx.save();
          ctx.fillStyle = activeBall.textColor || '#db5641';
          ctx.font = `900 ${Math.round(b.radius * 0.44)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('1', b.pos.x, b.pos.y + b.radius * 0.2);
          
          ctx.fillStyle = '#3d312a';
          ctx.font = `600 ${Math.round(b.radius * 0.25)}px sans-serif`;
          ctx.fillText('PRO', b.pos.x, b.pos.y - b.radius * 0.35);
          ctx.restore();
        }

        // Net geometric 3D wireframe mesh pattern
        if (activeBall.pattern === 'net' || activeBall.id === 'exclusive_net') {
          ctx.save();
          // Bottom tan cork band
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, b.radius - 0.5, 0.25 * Math.PI, 0.75 * Math.PI);
          ctx.lineTo(b.pos.x, b.pos.y + b.radius * 0.4);
          ctx.closePath();
          ctx.fillStyle = activeBall.secondaryColor || '#c28b52';
          ctx.fill();

          // Geometric triangulated wireframe mesh
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          // Horizontal / Diagonal lattice lines
          const pts = [
            { x: -0.6, y: -0.5 }, { x: 0, y: -0.7 }, { x: 0.6, y: -0.5 },
            { x: -0.7, y: 0 },    { x: -0.2, y: -0.1 }, { x: 0.3, y: 0 }, { x: 0.7, y: 0.1 },
            { x: -0.5, y: 0.45 }, { x: 0.1, y: 0.4 },  { x: 0.5, y: 0.5 }
          ];
          const px = (pt: {x: number, y: number}) => b.pos.x + pt.x * b.radius;
          const py = (pt: {x: number, y: number}) => b.pos.y + pt.y * b.radius;

          // Connect triangles
          const tris = [
            [0, 1, 4], [1, 2, 5], [1, 4, 5], [0, 3, 4],
            [3, 7, 4], [4, 7, 8], [4, 8, 5], [5, 8, 9], [5, 9, 6]
          ];
          tris.forEach(([i1, i2, i3]) => {
            ctx.moveTo(px(pts[i1]), py(pts[i1]));
            ctx.lineTo(px(pts[i2]), py(pts[i2]));
            ctx.lineTo(px(pts[i3]), py(pts[i3]));
            ctx.closePath();
          });
          ctx.stroke();

          // Glowing vertex nodes
          ctx.fillStyle = '#38bdf8';
          pts.forEach(pt => {
            ctx.beginPath();
            ctx.arc(px(pt), py(pt), 1.1, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }

        // Scribble abstract flowing ink loops & doodle curves
        if (activeBall.pattern === 'scribble' || activeBall.id === 'exclusive_scribble') {
          ctx.save();
          ctx.strokeStyle = activeBall.secondaryColor || '#09090b';
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          
          // Continuous doodle curlicue loops
          const r = b.radius;
          const ox = b.pos.x, oy = b.pos.y;
          // Loop 1
          ctx.moveTo(ox - r * 0.6, oy - r * 0.3);
          ctx.bezierCurveTo(ox - r * 0.7, oy - r * 0.7, ox - r * 0.1, oy - r * 0.8, ox - r * 0.1, oy - r * 0.4);
          ctx.bezierCurveTo(ox - r * 0.1, oy - r * 0.1, ox - r * 0.6, oy - r * 0.1, ox - r * 0.4, oy + r * 0.3);
          // Loop 2
          ctx.bezierCurveTo(ox - r * 0.2, oy + r * 0.6, ox + r * 0.4, oy + r * 0.7, ox + r * 0.3, oy + r * 0.2);
          ctx.bezierCurveTo(ox + r * 0.2, oy - r * 0.3, ox + r * 0.7, oy - r * 0.2, ox + r * 0.5, oy - r * 0.6);
          // Loop 3
          ctx.bezierCurveTo(ox + r * 0.3, oy - r * 0.8, ox, oy - r * 0.5, ox + r * 0.1, oy - r * 0.1);
          ctx.bezierCurveTo(ox + r * 0.2, oy + r * 0.3, ox - r * 0.3, oy + r * 0.4, ox - r * 0.5, oy + r * 0.55);
          ctx.stroke();

          // Ink accent splatter dots
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(ox + r * 0.35, oy - r * 0.35, 1.2, 0, Math.PI * 2);
          ctx.arc(ox - r * 0.3, oy - r * 0.45, 1.0, 0, Math.PI * 2);
          ctx.arc(ox + r * 0.1, oy + r * 0.45, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Specular glow shine highlight on top
        ctx.beginPath();
        ctx.arc(b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, b.radius * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fill();
    }

    let activeDragStart = dragStart;
    let activeDragCurrent = dragCurrent;
    let activeIsAiming = isAiming;

    if (touchControlsEnabled && !b.isMoving && !b.sunk && b.teleportTimer === 0) {
        const dragDistance = (touchPower / 100) * (MAX_POWER / POWER_MULTIPLIER);
        const dx = Math.cos(touchAngle) * dragDistance;
        const dy = Math.sin(touchAngle) * dragDistance;
        activeDragStart = b.pos;
        activeDragCurrent = { x: b.pos.x - dx, y: b.pos.y - dy };
        activeIsAiming = true;
    }

    if (activeIsAiming && activeDragStart && activeDragCurrent && !b.sunk && b.teleportTimer === 0) {
        const dx = activeDragStart.x - activeDragCurrent.x;
        const dy = activeDragStart.y - activeDragCurrent.y;
        const rawLen = Math.sqrt(dx*dx + dy*dy);
        const displayScaleFactor = Math.min(rawLen, 150) / (rawLen || 1); 
        
        if (rawLen > 5) {
            const angle = Math.atan2(dy, dx);
            const powerRatio = Math.min(rawLen, 150) / 150;
            // Scale arcRadius in game units relative to ball size to ensure it is always encircling the ball perfectly
            const arcRadius = Math.max(13, b.radius * 1.8);
            const arcStartX = b.pos.x + Math.cos(angle) * arcRadius;
            const arcStartY = b.pos.y + Math.sin(angle) * arcRadius;
            const lineEndX = arcStartX + dx * displayScaleFactor;
            const lineEndY = arcStartY + dy * displayScaleFactor;
            
            // Draw with a sleek drop shadow to guarantee high visibility of white elements
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // 1. Draw the white dashed line
            ctx.beginPath(); 
            ctx.moveTo(arcStartX, arcStartY); 
            ctx.lineTo(lineEndX, lineEndY);
            ctx.strokeStyle = '#FFF'; 
            ctx.lineWidth = 2.0; 
            ctx.setLineDash([7, 6]); 
            ctx.stroke(); 
            ctx.setLineDash([]);

            // 2. Draw clean white arrowhead pointing in shooting direction
            ctx.save();
            ctx.translate(lineEndX, lineEndY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -5);
            ctx.lineTo(-8, 0);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fillStyle = '#FFF';
            ctx.fill();
            ctx.restore();

            // 3. Draw power indicator arc around the ball
            ctx.beginPath(); 
            ctx.arc(b.pos.x, b.pos.y, arcRadius, angle - powerRatio * Math.PI, angle + powerRatio * Math.PI);
            ctx.strokeStyle = COLORS.WHITE;
            ctx.lineWidth = 2.0; 
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.restore();
        }
    }

    // Flag rendering (always rendered on top of everything else)
    ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x, h.y - 40); ctx.strokeStyle = COLORS.WHITE; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(h.x + 2, h.y - 40); ctx.lineTo(h.x + 18, h.y - 32); ctx.lineTo(h.x + 2, h.y - 24); ctx.closePath();
    ctx.fillStyle = COLORS.FLAG; ctx.fill(); ctx.strokeStyle = COLORS.WHITE; ctx.lineWidth = 1; ctx.stroke();

    // Draw confetti particles
    confettiParticlesRef.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        
        ctx.beginPath();
        if (p.shape === 'circle') {
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        } else if (p.shape === 'triangle') {
            ctx.moveTo(0, -p.size / 2);
            ctx.lineTo(p.size / 2, p.size / 2);
            ctx.lineTo(-p.size / 2, p.size / 2);
            ctx.closePath();
        } else {
            // square
            ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.fill();
        ctx.restore();
    });

    ctx.restore();
  }, [isAiming, dragStart, dragCurrent, level, dimensions, touchControlsEnabled, touchAngle, touchPower]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const elapsed = timestamp - lastFrameTimeRef.current;
      
      if (elapsed >= FRAME_DURATION) {
        lastFrameTimeRef.current = timestamp - (elapsed % FRAME_DURATION);
        update();
        render();
      }
      
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update, render]);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0 overflow-hidden bg-transparent rounded-2xl [mask-image:-webkit-radial-gradient(white,black)]">
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        className="cursor-crosshair touch-none select-none rounded-2xl" 
        onMouseDown={handleMouseDown} 
        onTouchStart={handleMouseDown}
      />

      {/* Touch Assist Enable/Disable toggler button (Top-Left) */}
      <button 
        type="button"
        onClick={(e) => { 
          e.stopPropagation(); 
          setTouchControlsEnabled(!touchControlsEnabled); 
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`absolute top-4 left-4 z-40 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 backdrop-blur-md pointer-events-auto border ${
          touchControlsEnabled 
            ? 'bg-[#db5641] text-[#faf6ee] border-[#db5641]' 
            : 'bg-[#faf6ee]/90 text-[#3d312a] border-[#3d312a]/20 hover:bg-[#faf6ee]'
        }`}
      >
        <span className="text-sm">🎮</span> {touchControlsEnabled ? 'Touch Assist: ON' : 'Touch Assist: OFF'}
      </button>

      {/* Floating Touch Controls HUD Dashboard (Bottom) */}
      {touchControlsEnabled && (
        <div 
          className="absolute bottom-4 left-4 right-4 z-30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#faf6ee]/95 border border-[#3d312a]/15 shadow-2xl backdrop-blur-md pointer-events-auto select-none transition-all animate-in slide-in-from-bottom duration-300 max-w-lg mx-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Aim Direction / Focus scrollable wheel dial */}
          <div className="flex-1 flex flex-col gap-1 px-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#7a7065] mb-0.5">
              <span className="flex items-center gap-1">🧭 <span>AIM DIRECTION: {Math.round((touchAngle * 180) / Math.PI)}°</span></span>
              <button 
                type="button"
                onClick={() => {
                  const b = ballRef.current;
                  const h = holeRef.current;
                  if (b && h) {
                    setTouchAngle(Math.atan2(h.y - b.pos.y, h.x - b.pos.x));
                  }
                }}
                className="text-[10px] text-[#db5641] hover:underline font-bold"
              >
                Snap to Hole
              </button>
            </div>

            {/* Scrolling Dial Track - Slide left/right to rotate line */}
            <div 
              ref={dialRef}
              onMouseDown={(e) => handleDialMouseDown(e.clientX)}
              onMouseMove={(e) => handleDialMouseMove(e.clientX)}
              onMouseUp={() => setDialDragging(false)}
              onMouseLeave={() => setDialDragging(false)}
              onTouchStart={(e) => handleDialMouseDown(e.touches[0].clientX)}
              onTouchMove={(e) => handleDialMouseMove(e.touches[0].clientX)}
              onTouchEnd={() => setDialDragging(false)}
              className="relative h-9 w-full bg-[#3d312a]/5 border border-[#3d312a]/10 rounded-xl overflow-hidden cursor-ew-resize flex items-center justify-center pointer-events-auto touch-none"
            >
              <div className="absolute inset-0 flex justify-between items-center px-4 opacity-30 select-none pointer-events-none font-mono text-[9px] text-[#3d312a]">
                <span>W</span><span>|</span><span>|</span><span>N</span><span>|</span><span>|</span><span>E</span><span>|</span><span>|</span><span>S</span>
              </div>
              <div className="absolute inset-x-0 h-[1px] bg-[#3d312a]/10 top-1/2 -translate-y-1/2"></div>
              
              {/* Center indicator line tick marks */}
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-full flex flex-col justify-between items-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-[#db5641]"></div>
                <div className="w-0.5 h-3 bg-[#db5641]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#db5641]"></div>
              </div>

              <span className="font-mono font-bold text-xs text-[#3d312a] z-10 bg-[#faf6ee] px-2 py-0.5 rounded-md border border-[#3d312a]/10 shadow-sm pointer-events-none">
                {Math.round((touchAngle * 180) / Math.PI)}°
              </span>
            </div>

            {/* Precise step adjusting buttons */}
            <div className="grid grid-cols-4 gap-1 mt-1 text-center">
              <button 
                type="button"
                onClick={() => adjustAngle(-5 * Math.PI / 180)}
                className="py-1 bg-[#3d312a]/5 hover:bg-[#3d312a]/10 text-[#3d312a] rounded-lg text-[10px] font-extrabold active:scale-95 transition-all"
              >
                -5°
              </button>
              <button 
                type="button"
                onClick={() => adjustAngle(-1 * Math.PI / 180)}
                className="py-1 bg-[#3d312a]/5 hover:bg-[#3d312a]/10 text-[#3d312a] rounded-lg text-[10px] font-extrabold active:scale-95 transition-all"
              >
                -1°
              </button>
              <button 
                type="button"
                onClick={() => adjustAngle(1 * Math.PI / 180)}
                className="py-1 bg-[#3d312a]/5 hover:bg-[#3d312a]/10 text-[#3d312a] rounded-lg text-[10px] font-extrabold active:scale-95 transition-all"
              >
                +1°
              </button>
              <button 
                type="button"
                onClick={() => adjustAngle(5 * Math.PI / 180)}
                className="py-1 bg-[#3d312a]/5 hover:bg-[#3d312a]/10 text-[#3d312a] rounded-lg text-[10px] font-extrabold active:scale-95 transition-all"
              >
                +5°
              </button>
            </div>
          </div>

          {/* Visual Divider block */}
          <div className="w-[1px] self-stretch bg-[#3d312a]/10 hidden md:block mx-1"></div>
          <div className="w-full h-[1px] bg-[#3d312a]/10 md:hidden my-1"></div>

          {/* Power intensity sliders */}
          <div className="w-full md:w-44 flex flex-col gap-1 px-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#7a7065] mb-0.5">
              <span className="flex items-center gap-1">⚡ <span>POWER: {touchPower}%</span></span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={touchPower} 
                onChange={(e) => setTouchPower(Number(e.target.value))}
                className="w-full accent-[#db5641] h-1.5 bg-[#3d312a]/10 rounded-lg cursor-pointer max-w-full"
              />
            </div>

            {/* Quick power selectors */}
            <div className="grid grid-cols-4 gap-1 mt-1 text-center">
              {[20, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTouchPower(pct)}
                  className={`py-1 rounded-md text-[10px] font-bold transition-all ${
                    touchPower === pct 
                      ? 'bg-[#db5641] text-white shadow-sm' 
                      : 'bg-[#3d312a]/5 hover:bg-[#3d312a]/10 text-[#3d312a]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Launch strike button */}
          <div className="flex flex-col justify-center">
            <button 
              type="button"
              disabled={isBallMoving}
              onClick={handleTouchShoot}
              className={`py-3 px-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 select-none text-white shadow-md active:scale-95 transition-all w-full md:w-28 ${
                isBallMoving 
                  ? 'bg-[#7a7065]/40 text-[#7a7065] cursor-not-allowed border-transparent shadow-none' 
                  : 'bg-[#db5641] hover:bg-[#c24a37]'
              }`}
            >
              <span className="text-[14px] font-extrabold tracking-wider leading-none">
                {isBallMoving ? 'ROLL' : 'PUTT!'}
              </span>
              <span className="text-[8px] tracking-tight opacity-75 leading-none uppercase">
                {isBallMoving ? 'WAITING' : 'Tap to strike'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
