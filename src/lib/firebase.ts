import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK using the provisioned configuration
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as required by Firebase integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface CloudArchitectProgressPayload {
  architectName: string;
  roleTitle: string;
  organization: string;
  completedModules: string[];
  completedScenarioIds: string[];
  dailyTargetMinutes: number;
  totalMinutesStudied: number;
  totalCombinedXp: number;
  currentLevel: number;
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutArchitect(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function loadArchitectProgressFromCloud(
  userId: string
): Promise<CloudArchitectProgressPayload | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      architectName: String(data.architectName || 'Senior AI Systems Architect'),
      roleTitle: String(data.roleTitle || 'Staff Agentic Engineer'),
      organization: String(data.organization || 'Enterprise AI Platform'),
      completedModules: Array.isArray(data.completedModules)
        ? data.completedModules
        : [],
      completedScenarioIds: Array.isArray(data.completedScenarioIds)
        ? data.completedScenarioIds
        : [],
      dailyTargetMinutes: Number(data.dailyTargetMinutes) || 45,
      totalMinutesStudied: Number(data.totalMinutesStudied) || 0,
      totalCombinedXp: Number(data.totalCombinedXp) || 0,
      currentLevel: Number(data.currentLevel) || 1,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function syncArchitectProgressToCloud(
  userId: string,
  payload: CloudArchitectProgressPayload
): Promise<void> {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);

  const sanitizedPayload = {
    architectName: payload.architectName.trim().slice(0, 120) || 'Senior AI Systems Architect',
    roleTitle: payload.roleTitle.trim().slice(0, 120) || 'Staff Agentic Engineer',
    organization: payload.organization.trim().slice(0, 120) || 'Enterprise AI Platform',
    completedModules: payload.completedModules.slice(0, 10),
    completedScenarioIds: payload.completedScenarioIds.slice(0, 10),
    dailyTargetMinutes: Math.max(10, Math.min(240, Math.round(payload.dailyTargetMinutes))),
    totalMinutesStudied: Math.max(0, Math.min(100000, Math.round(payload.totalMinutesStudied))),
    totalCombinedXp: Math.max(0, Math.min(500000, Math.round(payload.totalCombinedXp))),
    currentLevel: Math.max(1, Math.min(7, Math.round(payload.currentLevel))),
  };

  try {
    const existingSnap = await getDoc(userRef);
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        ownerId: userId,
        ...sanitizedPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        ...sanitizedPayload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
