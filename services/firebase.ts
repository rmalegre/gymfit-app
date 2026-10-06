import { FirebaseError, initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import * as FirebaseAuthRN from '@firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log('[Firestore] Inicializado correctamente.');
  } catch (error) {
    console.error('[Firebase] Error al inicializar App o Firestore:', error);
  }

  if (app) {
    try {
      auth = Platform.OS === 'web'
        ? getAuth(app)
        : initializeAuth(app, {
          // eslint-disable-next-line import/namespace -- Firebase's RN-only API is missing from its generic typings.
          persistence: FirebaseAuthRN.getReactNativePersistence(AsyncStorage),
        });
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
        auth = getAuth(app);
      } else {
        console.error('[Firebase Auth] Error al inicializar:', error);
      }
    }
  }
}

export const getCurrentUserId = (): string | null => auth?.currentUser?.uid ?? null;

export const getAuthenticatedUserId = (): string => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Debes iniciar sesión para acceder a tus datos.');
  }
  return userId;
};

export { app, auth, db, isFirebaseConfigured };
