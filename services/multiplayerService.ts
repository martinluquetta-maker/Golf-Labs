/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { getRankFromRP } from '../components/RankData';

export interface MultiplayerPlayer {
  uid: string;
  displayName: string;
  email?: string;
  rp: number;
  rankTier: number;
  ballSkin: string;
  trailSkin: string;
  isReady: boolean;
  strokes: number;
  totalStrokes: number;
  holeScores: Record<number, number>; // levelId or holeIndex -> strokes
  ballPos?: { x: number; y: number };
  ballVel?: { x: number; y: number };
  isMoving?: boolean;
  hasFinishedHole: boolean;
  isAiming?: boolean;
  aimAngle?: number;
  aimPower?: number;
  lastActive: number;
  isBot?: boolean;
}

export interface MultiplayerEmote {
  id: string;
  senderUid: string;
  senderName: string;
  emoji: string;
  text: string;
  timestamp: number;
}

export interface MultiplayerRoom {
  id: string;
  roomCode: string;
  hostUid: string;
  hostName: string;
  status: 'waiting' | 'starting' | 'in_game' | 'finished';
  mode: 'ranked_1v1' | 'casual_4p';
  holeCount: number;
  currentHoleIndex: number; // 0 to courseLevelIds.length - 1
  courseLevelIds: number[];
  players: Record<string, MultiplayerPlayer>;
  emotes: MultiplayerEmote[];
  winnerUid?: string;
  results?: {
    rankings: Array<{
      uid: string;
      displayName: string;
      totalStrokes: number;
      rpChange: number;
      newRP: number;
      oldRP: number;
      rankTier: number;
    }>;
  };
  createdAt: number;
  updatedAt: number;
}

// Generate human-friendly 6-digit room code like GOLF-7429
export function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `GOLF-${num}`;
}

// Memory fallback store if Firestore is unreachable or loading
const localRooms: Map<string, MultiplayerRoom> = new Map();
const localListeners: Map<string, Set<(room: MultiplayerRoom | null) => void>> = new Map();

function notifyLocalListeners(roomId: string, room: MultiplayerRoom | null) {
  const listeners = localListeners.get(roomId);
  if (listeners) {
    listeners.forEach(cb => cb(room));
  }
}

/**
 * Create a new multiplayer room
 */
export async function createRoom(
  hostUser: { uid: string; displayName: string; email?: string; rp?: number; ballSkin?: string; trailSkin?: string },
  options: { mode: 'ranked_1v1' | 'casual_4p'; holeCount: number; levelIds: number[] }
): Promise<MultiplayerRoom> {
  const roomId = generateRoomCode();
  const hostRP = hostUser.rp || 0;
  const hostRank = getRankFromRP(hostRP);

  const initialPlayer: MultiplayerPlayer = {
    uid: hostUser.uid,
    displayName: hostUser.displayName || 'Golfer',
    email: hostUser.email,
    rp: hostRP,
    rankTier: hostRank.tier,
    ballSkin: hostUser.ballSkin || 'classic',
    trailSkin: hostUser.trailSkin || 'classic',
    isReady: true,
    strokes: 0,
    totalStrokes: 0,
    holeScores: {},
    hasFinishedHole: false,
    lastActive: Date.now(),
    isBot: false,
  };

  const newRoom: MultiplayerRoom = {
    id: roomId,
    roomCode: roomId,
    hostUid: hostUser.uid,
    hostName: hostUser.displayName || 'Golfer',
    status: 'waiting',
    mode: options.mode,
    holeCount: options.holeCount,
    currentHoleIndex: 0,
    courseLevelIds: options.levelIds.slice(0, options.holeCount),
    players: {
      [hostUser.uid]: initialPlayer,
    },
    emotes: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  localRooms.set(roomId, newRoom);
  notifyLocalListeners(roomId, newRoom);

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      await setDoc(roomRef, newRoom);
    }
  } catch (err) {
    console.warn("Could not persist room to Firestore, using local room sync:", err);
  }

  return newRoom;
}

/**
 * Join an existing room by Code
 */
export async function joinRoom(
  roomIdOrCode: string,
  user: { uid: string; displayName: string; email?: string; rp?: number; ballSkin?: string; trailSkin?: string }
): Promise<MultiplayerRoom | null> {
  const cleanId = roomIdOrCode.trim().toUpperCase();
  const userRP = user.rp || 0;
  const userRank = getRankFromRP(userRP);

  const playerObj: MultiplayerPlayer = {
    uid: user.uid,
    displayName: user.displayName || 'Golfer',
    email: user.email,
    rp: userRP,
    rankTier: userRank.tier,
    ballSkin: user.ballSkin || 'classic',
    trailSkin: user.trailSkin || 'classic',
    isReady: true,
    strokes: 0,
    totalStrokes: 0,
    holeScores: {},
    hasFinishedHole: false,
    lastActive: Date.now(),
    isBot: false,
  };

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', cleanId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as MultiplayerRoom;
        
        // Check player count limit
        const playerCount = Object.keys(room.players || {}).length;
        if (room.mode === 'ranked_1v1' && playerCount >= 2 && !room.players[user.uid]) {
          throw new Error("La sala de Duelo 1v1 ya está llena.");
        }
        if (playerCount >= 4 && !room.players[user.uid]) {
          throw new Error("La sala ha alcanzado el límite máximo de 4 jugadores.");
        }

        const updatedPlayers = {
          ...room.players,
          [user.uid]: playerObj,
        };

        await updateDoc(roomRef, {
          players: updatedPlayers,
          updatedAt: Date.now(),
        });

        const updatedRoom = { ...room, players: updatedPlayers, updatedAt: Date.now() };
        localRooms.set(cleanId, updatedRoom);
        notifyLocalListeners(cleanId, updatedRoom);
        return updatedRoom;
      }
    }
  } catch (e: any) {
    if (e.message && e.message.includes("sala")) throw e;
    console.warn("Firestore join failed, checking local room fallback:", e);
  }

  // Local fallback
  const local = localRooms.get(cleanId);
  if (local) {
    local.players[user.uid] = playerObj;
    local.updatedAt = Date.now();
    notifyLocalListeners(cleanId, local);
    return local;
  }

  throw new Error(`No se encontró ninguna sala activa con el código ${cleanId}.`);
}

/**
 * Quick Matchmaking: Find an open waiting room or create a new ranked match
 */
export async function quickMatchmake(
  user: { uid: string; displayName: string; email?: string; rp?: number; ballSkin?: string; trailSkin?: string },
  levelIds: number[]
): Promise<MultiplayerRoom> {
  const userRP = user.rp || 0;

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomsRef = collection(db, 'multiplayer_rooms');
      const q = query(
        roomsRef, 
        where('status', '==', 'waiting'),
        where('mode', '==', 'ranked_1v1')
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        const room = docSnap.data() as MultiplayerRoom;
        const pKeys = Object.keys(room.players || {});
        // If room is waiting and has 1 player (not self)
        if (pKeys.length === 1 && !room.players[user.uid]) {
          const joined = await joinRoom(room.id, user);
          if (joined) return joined;
        }
      }
    }
  } catch (err) {
    console.warn("Quick match query error:", err);
  }

  // Check local waiting rooms
  for (const [id, room] of localRooms.entries()) {
    if (room.status === 'waiting' && room.mode === 'ranked_1v1') {
      const pKeys = Object.keys(room.players || {});
      if (pKeys.length === 1 && !room.players[user.uid]) {
        return joinRoom(id, user) as Promise<MultiplayerRoom>;
      }
    }
  }

  // No room found, create new one
  return createRoom(user, {
    mode: 'ranked_1v1',
    holeCount: 3, // Fast 3-hole competitive ranked sprint
    levelIds: levelIds.slice(0, 3),
  });
}

/**
 * Start Match (Host only)
 */
export async function startMatch(roomId: string): Promise<void> {
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      await updateDoc(roomRef, {
        status: 'in_game',
        currentHoleIndex: 0,
        updatedAt: Date.now(),
      });
    }
  } catch (e) {
    console.warn("Could not update status to in_game in Firestore:", e);
  }

  const local = localRooms.get(roomId);
  if (local) {
    local.status = 'in_game';
    local.currentHoleIndex = 0;
    local.updatedAt = Date.now();
    notifyLocalListeners(roomId, local);
  }
}

/**
 * Real-time Subscription to Room State
 */
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: MultiplayerRoom | null) => void
): Unsubscribe {
  let unsubFirestore: Unsubscribe | null = null;

  // Local listener register
  if (!localListeners.has(roomId)) {
    localListeners.set(roomId, new Set());
  }
  localListeners.get(roomId)!.add(onUpdate);

  // Send current cached value if exists
  if (localRooms.has(roomId)) {
    onUpdate(localRooms.get(roomId)!);
  }

  getFirebaseServices().then(({ db, configured }) => {
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      unsubFirestore = onSnapshot(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as MultiplayerRoom;
          localRooms.set(roomId, data);
          onUpdate(data);
        } else {
          onUpdate(null);
        }
      }, (err) => {
        console.warn("Firestore snapshot error on room:", err);
      });
    }
  });

  return () => {
    if (unsubFirestore) {
      unsubFirestore();
    }
    const listeners = localListeners.get(roomId);
    if (listeners) {
      listeners.delete(onUpdate);
    }
  };
}

/**
 * Broadcast Aiming indicator
 */
export async function broadcastPlayerAim(
  roomId: string,
  playerUid: string,
  isAiming: boolean,
  angle?: number,
  power?: number
): Promise<void> {
  const local = localRooms.get(roomId);
  if (local && local.players[playerUid]) {
    local.players[playerUid].isAiming = isAiming;
    local.players[playerUid].aimAngle = angle;
    local.players[playerUid].aimPower = power;
    local.players[playerUid].lastActive = Date.now();
    notifyLocalListeners(roomId, { ...local });
  }

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      await updateDoc(roomRef, {
        [`players.${playerUid}.isAiming`]: isAiming,
        [`players.${playerUid}.aimAngle`]: angle ?? 0,
        [`players.${playerUid}.aimPower`]: power ?? 0,
        [`players.${playerUid}.lastActive`]: Date.now(),
      });
    }
  } catch (e) {
    // Ignore minor sync glitches
  }
}

/**
 * Broadcast Ball Stroke and Position
 */
export async function broadcastPlayerStroke(
  roomId: string,
  playerUid: string,
  data: {
    pos: { x: number; y: number };
    vel: { x: number; y: number };
    strokes: number;
    totalStrokes: number;
    isMoving: boolean;
  }
): Promise<void> {
  const local = localRooms.get(roomId);
  if (local && local.players[playerUid]) {
    const p = local.players[playerUid];
    p.ballPos = data.pos;
    p.ballVel = data.vel;
    p.strokes = data.strokes;
    p.totalStrokes = data.totalStrokes;
    p.isMoving = data.isMoving;
    p.isAiming = false;
    p.lastActive = Date.now();
    notifyLocalListeners(roomId, { ...local });
  }

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      await updateDoc(roomRef, {
        [`players.${playerUid}.ballPos`]: data.pos,
        [`players.${playerUid}.ballVel`]: data.vel,
        [`players.${playerUid}.strokes`]: data.strokes,
        [`players.${playerUid}.totalStrokes`]: data.totalStrokes,
        [`players.${playerUid}.isMoving`]: data.isMoving,
        [`players.${playerUid}.isAiming`]: false,
        [`players.${playerUid}.lastActive`]: Date.now(),
      });
    }
  } catch (e) {
    // Ignore network update noise
  }
}

/**
 * Broadcast Hole Completion for Player
 */
export async function broadcastHoleComplete(
  roomId: string,
  playerUid: string,
  holeIndex: number,
  strokesOnHole: number
): Promise<void> {
  const local = localRooms.get(roomId);
  if (!local) return;

  const player = local.players[playerUid];
  if (player) {
    player.hasFinishedHole = true;
    player.holeScores[holeIndex] = strokesOnHole;
  }

  // Check if ALL players in the room have finished this hole
  const playerList = Object.values(local.players);
  const allFinished = playerList.every(p => p.hasFinishedHole);

  let nextHoleIndex = local.currentHoleIndex;
  let newStatus = local.status;
  let winnerUid: string | undefined = undefined;
  let matchResults: any = undefined;

  if (allFinished) {
    if (local.currentHoleIndex + 1 < local.holeCount) {
      // Advance to next hole
      nextHoleIndex = local.currentHoleIndex + 1;
      playerList.forEach(p => {
        p.hasFinishedHole = false;
        p.strokes = 0;
        p.isMoving = false;
        p.isAiming = false;
      });
    } else {
      // Match Complete! Calculate Results and RP Adjustments
      newStatus = 'finished';

      // Sort by lowest total strokes (Golf rules: lowest strokes wins)
      const sortedPlayers = [...playerList].sort((a, b) => a.totalStrokes - b.totalStrokes);
      winnerUid = sortedPlayers[0]?.uid;

      const rankings = sortedPlayers.map((p, idx) => {
        const isWinner = idx === 0;
        const isSecond = idx === 1;
        
        let rpChange = isWinner ? 45 : (isSecond && playerList.length > 2 ? 15 : -20);
        if (sortedPlayers.length === 2 && !isWinner) {
          rpChange = -20;
        }

        const newRP = Math.max(0, p.rp + rpChange);
        const newRank = getRankFromRP(newRP);

        return {
          uid: p.uid,
          displayName: p.displayName,
          totalStrokes: p.totalStrokes,
          rpChange,
          newRP,
          oldRP: p.rp,
          rankTier: newRank.tier,
        };
      });

      matchResults = { rankings };
    }
  }

  local.currentHoleIndex = nextHoleIndex;
  local.status = newStatus;
  local.winnerUid = winnerUid;
  local.results = matchResults;
  local.updatedAt = Date.now();
  notifyLocalListeners(roomId, { ...local });

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      await updateDoc(roomRef, {
        players: local.players,
        currentHoleIndex: nextHoleIndex,
        status: newStatus,
        winnerUid: winnerUid || null,
        results: matchResults || null,
        updatedAt: Date.now(),
      });
    }
  } catch (e) {
    console.warn("Hole complete sync error:", e);
  }
}

/**
 * Send Live Emote / Reaction
 */
export async function sendEmote(
  roomId: string,
  senderUid: string,
  senderName: string,
  emoji: string,
  text: string
): Promise<void> {
  const newEmote: MultiplayerEmote = {
    id: `emote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderUid,
    senderName,
    emoji,
    text,
    timestamp: Date.now(),
  };

  const local = localRooms.get(roomId);
  if (local) {
    local.emotes = [...(local.emotes || []).slice(-8), newEmote];
    notifyLocalListeners(roomId, { ...local });
  }

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      const currentEmotes = (local?.emotes || []).slice(-8);
      await updateDoc(roomRef, {
        emotes: currentEmotes,
      });
    }
  } catch (e) {
    // Ignore minor emote errors
  }
}

/**
 * Leave Room
 */
export async function leaveRoom(roomId: string, playerUid: string): Promise<void> {
  const local = localRooms.get(roomId);
  if (local && local.players[playerUid]) {
    delete local.players[playerUid];
    if (Object.keys(local.players).length === 0) {
      localRooms.delete(roomId);
    } else {
      if (local.hostUid === playerUid) {
        local.hostUid = Object.keys(local.players)[0];
      }
      notifyLocalListeners(roomId, { ...local });
    }
  }

  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const roomRef = doc(db, 'multiplayer_rooms', roomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data() as MultiplayerRoom;
        if (data.players && data.players[playerUid]) {
          delete data.players[playerUid];
          if (Object.keys(data.players).length === 0) {
            await deleteDoc(roomRef);
          } else {
            await updateDoc(roomRef, {
              players: data.players,
              hostUid: data.hostUid === playerUid ? Object.keys(data.players)[0] : data.hostUid,
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Leave room error:", e);
  }
}

/**
 * Spawn a Smart Golf Bot for instantaneous 1v1 action when queuing alone
 */
export function addBotOpponentToRoom(room: MultiplayerRoom): MultiplayerRoom {
  const botNames = ['Tiger Putt', 'Birdie Queen', 'Eagle Eye Max', 'Cyber Golfer X', 'Green Phantom', 'Albatross Pro'];
  const randomName = botNames[Math.floor(Math.random() * botNames.length)];
  const botUid = `bot_${Date.now()}`;
  const botRP = Math.max(100, Math.floor(Math.random() * 2200));
  const botRank = getRankFromRP(botRP);

  const botPlayer: MultiplayerPlayer = {
    uid: botUid,
    displayName: `🤖 ${randomName}`,
    rp: botRP,
    rankTier: botRank.tier,
    ballSkin: 'fire',
    trailSkin: 'rainbow',
    isReady: true,
    strokes: 0,
    totalStrokes: 0,
    holeScores: {},
    hasFinishedHole: false,
    lastActive: Date.now(),
    isBot: true,
  };

  room.players[botUid] = botPlayer;
  room.updatedAt = Date.now();
  localRooms.set(room.id, room);
  notifyLocalListeners(room.id, room);
  return room;
}

/**
 * Convenient API Aliases for Canvas & HUD integration
 */
export async function updatePlayerAim(
  roomId: string, 
  playerUid: string, 
  aim: { isAiming: boolean; power: number; angle: number } | null
): Promise<void> {
  return broadcastPlayerAim(roomId, playerUid, aim?.isAiming ?? false, aim?.angle, aim?.power);
}

export async function updatePlayerLivePosition(
  roomId: string,
  playerUid: string,
  pos: { x: number; y: number },
  vel: { x: number; y: number },
  isMoving: boolean
): Promise<void> {
  return broadcastPlayerStroke(roomId, playerUid, { pos, vel, isMoving, strokes: 0, totalStrokes: 0 });
}

export async function recordHoleComplete(
  roomId: string,
  playerUid: string,
  strokes: number
): Promise<void> {
  const local = localRooms.get(roomId);
  const currentHole = local?.currentHoleIndex ?? 0;
  return broadcastHoleComplete(roomId, playerUid, currentHole, strokes);
}

export async function submitStroke(
  roomId: string,
  playerUid: string,
  strokes: number
): Promise<void> {
  const local = localRooms.get(roomId);
  if (local && local.players[playerUid]) {
    local.players[playerUid].strokes = strokes;
    local.players[playerUid].totalStrokes = (local.players[playerUid].totalStrokes || 0) + 1;
    notifyLocalListeners(roomId, { ...local });
  }
}
