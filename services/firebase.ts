import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global cached instances
let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;
let firebaseConfigured = false;

export async function getFirebaseServices() {
  if (firebaseConfigured) {
    return {
      db: dbInstance,
      auth: authInstance,
      provider: googleProviderInstance,
      configured: true
    };
  }

  try {
    if (!config || !config.apiKey) {
      return { db: null, auth: null, provider: null, configured: false };
    }

    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }

    dbInstance = getFirestore(appInstance, config.firestoreDatabaseId);
    authInstance = getAuth(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
    firebaseConfigured = true;

    return {
      db: dbInstance,
      auth: authInstance,
      provider: googleProviderInstance,
      configured: true
    };
  } catch (err) {
    console.warn("Firebase configuration not loaded or readable yet.", err);
    return { db: null, auth: null, provider: null, configured: false };
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null): never {
  const currentUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication wrappers
export async function authenticateWithGoogle() {
  const { auth, provider, configured } = await getFirebaseServices();
  if (!configured) {
    throw new Error("Google Authentication cannot be established: Firebase configuration is not yet loaded.");
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google sign in popup error:", error);
    throw error;
  }
}

export async function authenticateWithEmail(email: string, password: string) {
  const { auth, configured } = await getFirebaseServices();
  if (!configured) {
    throw new Error("Authentication cannot be established: Firebase configuration is not yet loaded.");
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    console.error("Email sign in error:", error);
    throw error;
  }
}

export async function registerWithEmail(email: string, password: string, displayName?: string) {
  const { auth, configured } = await getFirebaseServices();
  if (!configured) {
    throw new Error("Authentication cannot be established: Firebase configuration is not yet loaded.");
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim()) {
      await updateProfile(result.user, {
        displayName: displayName.trim()
      });
    }
    return result.user;
  } catch (error) {
    console.error("Email registration error:", error);
    throw error;
  }
}

export async function sendPasswordReset(email: string) {
  const { auth, configured } = await getFirebaseServices();
  if (!configured) {
    throw new Error("Authentication cannot be established: Firebase configuration is not yet loaded.");
  }
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
}

export async function logOutFromGoogle() {
  const { auth, configured } = await getFirebaseServices();
  if (!configured) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Firestore user state loaders/savers
export async function loadUserProfile(userId: string) {
  const { db, configured } = await getFirebaseServices();
  if (!configured) return null;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(userId: string, data: any) {
  const { db, configured } = await getFirebaseServices();
  if (!configured) return;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...data,
      userId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getLeaderboard(limitCount: number = 50) {
  const { db, configured } = await getFirebaseServices();
  if (!configured) return [];
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('points', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const leaderboard: any[] = [];
    querySnapshot.forEach((doc) => {
      leaderboard.push({ id: doc.id, ...doc.data() });
    });
    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

export interface ExclusiveGrantRecord {
  id?: string;
  targetIdentifier: string;
  targetType: 'email' | 'account_name';
  setName: string;
  ballIds: string[];
  trailIds: string[];
  grantedBy: string;
  grantedAt: any;
  note?: string;
}

const LOCAL_STORAGE_GRANTS_KEY = 'retro_golf_exclusive_grants';

export function getLocalGrants(): ExclusiveGrantRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_GRANTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalGrants(grants: ExclusiveGrantRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_GRANTS_KEY, JSON.stringify(grants));
  } catch (e) {
    console.error("Failed to save local grants:", e);
  }
}

export async function createExclusiveGrant(
  targetIdentifier: string,
  targetType: 'email' | 'account_name',
  setName: string,
  ballIds: string[],
  trailIds: string[],
  note?: string,
  grantedBy: string = 'martin.luquetta@sgs.edu.co'
): Promise<{ success: boolean; id: string; message: string }> {
  const cleanTarget = targetIdentifier.trim().toLowerCase();
  if (!cleanTarget) {
    return { success: false, id: '', message: 'Target email or account name cannot be empty.' };
  }

  const newGrant: ExclusiveGrantRecord = {
    targetIdentifier: cleanTarget,
    targetType,
    setName,
    ballIds,
    trailIds,
    grantedBy,
    grantedAt: new Date().toISOString(),
    note: note || `Granted by creator Martin Luquetta`
  };

  // 1. Save to localStorage cache
  const localList = getLocalGrants().filter(g => g.targetIdentifier !== cleanTarget || g.setName !== setName);
  const generatedId = `grant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  newGrant.id = generatedId;
  localList.unshift(newGrant);
  saveLocalGrants(localList);

  // 2. Save to Firestore if available
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const grantDocRef = doc(db, 'exclusive_grants', generatedId);
      await setDoc(grantDocRef, {
        ...newGrant,
        grantedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn("Could not write grant to Firestore cloud, saved to local synced storage:", err);
  }

  return { 
    success: true, 
    id: generatedId, 
    message: `Successfully granted ${setName} to ${targetType === 'email' ? 'email' : 'account'} "${cleanTarget}"!` 
  };
}

export async function fetchExclusiveGrants(): Promise<ExclusiveGrantRecord[]> {
  const localList = getLocalGrants();
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const grantsRef = collection(db, 'exclusive_grants');
      const querySnapshot = await getDocs(grantsRef);
      const cloudGrants: ExclusiveGrantRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        cloudGrants.push({ id: docSnap.id, ...docSnap.data() } as ExclusiveGrantRecord);
      });
      if (cloudGrants.length > 0) {
        // Merge with local list
        const map = new Map<string, ExclusiveGrantRecord>();
        [...localList, ...cloudGrants].forEach(item => {
          map.set(`${item.targetIdentifier}_${item.setName}`, item);
        });
        const merged = Array.from(map.values());
        saveLocalGrants(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not fetch grants from Firestore, using local grants:", err);
  }
  return localList;
}

export async function deleteExclusiveGrant(grantId: string): Promise<boolean> {
  // Remove from local cache
  const localList = getLocalGrants().filter(g => g.id !== grantId);
  saveLocalGrants(localList);

  // Remove from Firestore
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      // Set to soft-deleted or remove doc
      const docRef = doc(db, 'exclusive_grants', grantId);
      await setDoc(docRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.warn("Error deleting cloud grant:", err);
  }
  return true;
}

export async function checkMatchingGrants(userEmail?: string | null, displayName?: string | null, accountName?: string | null): Promise<{
  matchedGrants: ExclusiveGrantRecord[];
  ballIds: string[];
  trailIds: string[];
}> {
  const grants = await fetchExclusiveGrants();
  const emailsToCheck = [
    (userEmail || '').toLowerCase().trim(),
    (accountName || '').toLowerCase().trim(),
  ].filter(Boolean);

  const namesToCheck = [
    (displayName || '').toLowerCase().trim(),
    (accountName || '').toLowerCase().trim(),
  ].filter(Boolean);

  const matched: ExclusiveGrantRecord[] = [];
  const balls = new Set<string>();
  const trails = new Set<string>();

  for (const g of grants) {
    const ident = (g.targetIdentifier || '').toLowerCase().trim();
    const isEmailMatch = g.targetType === 'email' && emailsToCheck.includes(ident);
    const isNameMatch = g.targetType === 'account_name' && namesToCheck.includes(ident);
    const isAnyMatch = emailsToCheck.includes(ident) || namesToCheck.includes(ident);

    if (isEmailMatch || isNameMatch || isAnyMatch) {
      matched.push(g);
      (g.ballIds || []).forEach(b => balls.add(b));
      (g.trailIds || []).forEach(t => trails.add(t));
    }
  }

  return {
    matchedGrants: matched,
    ballIds: Array.from(balls),
    trailIds: Array.from(trails),
  };
}

// ----------------------------------------------------
// PLAYER BAN & MODERATION SYSTEM
// ----------------------------------------------------

export interface PlayerBanRecord {
  id?: string;
  targetIdentifier: string; // lowercased email, username, or uid
  targetType: 'email' | 'account_name' | 'user_id';
  reason: string;
  durationLabel: string; // e.g. "10 Minutes", "1 Hour", "24 Hours", "3 Days", "7 Days", "30 Days", "Permanent", "Custom"
  durationMinutes?: number; // total duration in minutes if temporary
  bannedAt: string; // ISO date string
  expiresAt: string | null; // ISO date string or null if permanent
  isPermanent: boolean;
  isActive: boolean;
  bannedBy: string;
  note?: string;
}

const LOCAL_STORAGE_BANS_KEY = 'retro_golf_player_bans';

export function getLocalBans(): PlayerBanRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_BANS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalBans(bans: PlayerBanRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_BANS_KEY, JSON.stringify(bans));
  } catch (e) {
    console.error("Failed to save local bans:", e);
  }
}

export async function createPlayerBan(
  targetIdentifier: string,
  targetType: 'email' | 'account_name' | 'user_id',
  reason: string,
  durationMinutes: number | 'permanent',
  durationLabel: string,
  note?: string,
  bannedBy: string = 'martin.luquetta@sgs.edu.co'
): Promise<{ success: boolean; id: string; message: string; ban: PlayerBanRecord }> {
  const cleanTarget = targetIdentifier.trim().toLowerCase();
  if (!cleanTarget) {
    throw new Error('Target player email, username, or ID is required.');
  }

  const isPermanent = durationMinutes === 'permanent';
  const now = new Date();
  const bannedAt = now.toISOString();
  
  let expiresAt: string | null = null;
  if (!isPermanent && typeof durationMinutes === 'number' && durationMinutes > 0) {
    const expDate = new Date(now.getTime() + durationMinutes * 60 * 1000);
    expiresAt = expDate.toISOString();
  }

  const generatedId = `ban_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newBan: PlayerBanRecord = {
    id: generatedId,
    targetIdentifier: cleanTarget,
    targetType,
    reason: reason.trim() || 'Community Policy Violation / Moderation Action',
    durationLabel,
    durationMinutes: isPermanent ? undefined : durationMinutes,
    bannedAt,
    expiresAt,
    isPermanent,
    isActive: true,
    bannedBy,
    note: note?.trim() || 'Suspension issued via Martin Luquetta Master Console'
  };

  // 1. Save to localStorage cache (replace existing ban for same target if active)
  const localList = getLocalBans().filter(b => b.targetIdentifier !== cleanTarget || !b.isActive);
  localList.unshift(newBan);
  saveLocalBans(localList);

  // 2. Save to Firestore if available
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const banDocRef = doc(db, 'player_bans', generatedId);
      await setDoc(banDocRef, {
        ...newBan,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn("Could not write ban to Firestore cloud, saved to local synced storage:", err);
  }

  return {
    success: true,
    id: generatedId,
    message: `Successfully banned ${targetType === 'email' ? 'email' : 'player'} "${cleanTarget}" for ${durationLabel}.`,
    ban: newBan
  };
}

export async function fetchPlayerBans(): Promise<PlayerBanRecord[]> {
  const localList = getLocalBans();
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const bansRef = collection(db, 'player_bans');
      const querySnapshot = await getDocs(bansRef);
      const cloudBans: PlayerBanRecord[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && !data.deleted) {
          cloudBans.push({ id: docSnap.id, ...data } as PlayerBanRecord);
        }
      });
      if (cloudBans.length > 0) {
        // Merge cloud with local
        const map = new Map<string, PlayerBanRecord>();
        [...localList, ...cloudBans].forEach(item => {
          map.set(item.id || `${item.targetIdentifier}_${item.bannedAt}`, item);
        });
        const merged = Array.from(map.values()).sort((a, b) => 
          new Date(b.bannedAt).getTime() - new Date(a.bannedAt).getTime()
        );
        saveLocalBans(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not fetch bans from Firestore, using local cache:", err);
  }
  return localList;
}

export async function revokePlayerBan(banId: string): Promise<boolean> {
  // Update local list
  const localList = getLocalBans().map(b => {
    if (b.id === banId) {
      return { ...b, isActive: false };
    }
    return b;
  });
  saveLocalBans(localList);

  // Update in Firestore
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const docRef = doc(db, 'player_bans', banId);
      await setDoc(docRef, { isActive: false, revokedAt: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.warn("Error revoking cloud ban:", err);
  }
  return true;
}

export async function deletePlayerBan(banId: string): Promise<boolean> {
  // Remove from local cache
  const localList = getLocalBans().filter(b => b.id !== banId);
  saveLocalBans(localList);

  // Soft delete / remove in Firestore
  try {
    const { db, configured } = await getFirebaseServices();
    if (configured && db) {
      const docRef = doc(db, 'player_bans', banId);
      await setDoc(docRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
    }
  } catch (err) {
    console.warn("Error deleting cloud ban:", err);
  }
  return true;
}

export async function checkUserBanStatus(
  userEmail?: string | null,
  displayName?: string | null,
  uid?: string | null
): Promise<{
  isBanned: boolean;
  banRecord?: PlayerBanRecord;
  timeLeftFormatted?: string;
}> {
  // Admin / Creator is always immune to bans
  const email = (userEmail || '').toLowerCase().trim();
  if (email === 'martin.luquetta@sgs.edu.co' || email.startsWith('martin.luquetta')) {
    return { isBanned: false };
  }

  const bans = await fetchPlayerBans();
  const emailsToCheck = [email].filter(Boolean);
  const namesToCheck = [(displayName || '').toLowerCase().trim()].filter(Boolean);
  const uidsToCheck = [(uid || '').toLowerCase().trim()].filter(Boolean);

  const now = new Date();

  for (const ban of bans) {
    if (!ban.isActive) continue;

    const ident = (ban.targetIdentifier || '').toLowerCase().trim();
    const isEmailMatch = emailsToCheck.includes(ident);
    const isNameMatch = namesToCheck.includes(ident);
    const isUidMatch = uidsToCheck.includes(ident);

    if (isEmailMatch || isNameMatch || isUidMatch) {
      // Check if ban is permanent or still active
      if (ban.isPermanent || !ban.expiresAt) {
        return {
          isBanned: true,
          banRecord: ban,
          timeLeftFormatted: 'Permanent Suspension'
        };
      }

      const expDate = new Date(ban.expiresAt);
      if (expDate.getTime() > now.getTime()) {
        const diffMs = expDate.getTime() - now.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSecs / 86400);
        const hours = Math.floor((diffSecs % 86400) / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;

        let timeStr = '';
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0 || days > 0) timeStr += `${hours}h `;
        timeStr += `${mins}m ${secs}s`;

        return {
          isBanned: true,
          banRecord: ban,
          timeLeftFormatted: timeStr.trim()
        };
      } else {
        // Ban has expired! Automatically mark inactive
        revokePlayerBan(ban.id || '');
      }
    }
  }

  return { isBanned: false };
}

