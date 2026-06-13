import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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
    const response = await fetch('/firebase-applet-config.json');
    if (!response.ok) {
      return { db: null, auth: null, provider: null, configured: false };
    }
    const config = await response.json();
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
    console.warn("Firebase configuration file not loaded or readable yet.", err);
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
