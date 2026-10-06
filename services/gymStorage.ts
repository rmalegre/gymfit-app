import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db, getAuthenticatedUserId, getCurrentUserId, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  weightKg: number;
  completed: boolean;
}

export interface Routine {
  id: string;
  name: string;
  durationMin: number;
  intensity: 'Media' | 'Alta' | 'Intensa';
  exercises: Exercise[];
}

export interface PersonalRecord {
  id: string;
  lift: string;
  weightKg: number;
  date: string;
  icon: string;
}

export interface WeightEntry {
  id: string;
  weightKg: number;
  date: string;
}

export interface UserProfile {
  name: string;
  level: string;
  goal: 'Hipertrofia' | 'Fuerza' | 'Definición';
  sessions: number;
  volumeTon: number;
  streakDays: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  useKg: boolean;
}

export interface WatchedVideo {
  videoId: string;
  exerciseName: string;
  watchedAt: string;
}

// Datos iniciales predeterminados
export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'chest_triceps',
    name: 'Pecho y Tríceps',
    durationMin: 55,
    intensity: 'Alta',
    exercises: [
      { id: '1', name: 'Press de Banca Plano con Barra', muscle: 'Pectoral', sets: 4, reps: '8-10', weightKg: 75, completed: false },
      { id: '2', name: 'Press Inclinado con Mancuernas', muscle: 'Pectoral Superior', sets: 3, reps: '10-12', weightKg: 26, completed: false },
      { id: '3', name: 'Aperturas en Polea (Cruces)', muscle: 'Pectoral Aislado', sets: 3, reps: '12-15', weightKg: 15, completed: false },
      { id: '4', name: 'Fondos en Paralelas (Dips)', muscle: 'Tríceps / Pecho', sets: 3, reps: '10-12', weightKg: 0, completed: false },
      { id: '5', name: 'Extensión de Tríceps en Polea Alta', muscle: 'Tríceps', sets: 4, reps: '12', weightKg: 25, completed: false },
    ],
  },
  {
    id: 'back_biceps',
    name: 'Espalda y Bíceps',
    durationMin: 60,
    intensity: 'Alta',
    exercises: [
      { id: 'b1', name: 'Dominadas Pronas (Pull-ups)', muscle: 'Dorsales', sets: 4, reps: '8-10', weightKg: 0, completed: false },
      { id: 'b2', name: 'Remo con Barra 90°', muscle: 'Espalda Media', sets: 4, reps: '8-10', weightKg: 65, completed: false },
      { id: 'b3', name: 'Jalón al Pecho en Polea', muscle: 'Dorsales', sets: 3, reps: '10-12', weightKg: 55, completed: false },
      { id: 'b4', name: 'Curl de Bíceps con Barra Z', muscle: 'Bíceps', sets: 4, reps: '10-12', weightKg: 30, completed: false },
      { id: 'b5', name: 'Curl Martillo con Mancuernas', muscle: 'Braquial', sets: 3, reps: '12', weightKg: 14, completed: false },
    ],
  },
  {
    id: 'legs_core',
    name: 'Piernas y Glúteos',
    durationMin: 65,
    intensity: 'Intensa',
    exercises: [
      { id: 'l1', name: 'Sentadilla Libre con Barra (Squat)', muscle: 'Cuádriceps / Glúteos', sets: 4, reps: '6-8', weightKg: 100, completed: false },
      { id: 'l2', name: 'Prensa Inclinada 45°', muscle: 'Cuádriceps', sets: 4, reps: '10-12', weightKg: 180, completed: false },
      { id: 'l3', name: 'Peso Muerto Rumano', muscle: 'Isquiosurales', sets: 4, reps: '8-10', weightKg: 85, completed: false },
      { id: 'l4', name: 'Elevación de Gemelos en Máquina', muscle: 'Pantorrillas', sets: 4, reps: '15', weightKg: 50, completed: false },
      { id: 'l5', name: 'Plancha Abdominal Activa', muscle: 'Core', sets: 3, reps: '45 seg', weightKg: 0, completed: false },
    ],
  },
  {
    id: 'shoulders_arms',
    name: 'Hombros y Brazos',
    durationMin: 50,
    intensity: 'Media',
    exercises: [
      { id: 's1', name: 'Press Militar de Hombros con Barra', muscle: 'Deltoides Anterior', sets: 4, reps: '8-10', weightKg: 45, completed: false },
      { id: 's2', name: 'Elevaciones Laterales con Mancuerna', muscle: 'Deltoides Lateral', sets: 4, reps: '12-15', weightKg: 12, completed: false },
      { id: 's3', name: 'Pájaros para Deltoides Posterior', muscle: 'Deltoides Posterior', sets: 3, reps: '15', weightKg: 10, completed: false },
      { id: 's4', name: 'Superserie Bíceps/Tríceps', muscle: 'Brazos', sets: 3, reps: '12', weightKg: 20, completed: false },
    ],
  },
];

export const DEFAULT_PRS: PersonalRecord[] = [
  { id: '1', lift: 'Press de Banca Plano', weightKg: 95, date: '28 Sep', icon: 'barbell' },
  { id: '2', lift: 'Sentadilla Libre (Squat)', weightKg: 130, date: '25 Sep', icon: 'fitness' },
  { id: '3', lift: 'Peso Muerto Convencional', weightKg: 160, date: '18 Sep', icon: 'trophy' },
  { id: '4', lift: 'Press Militar con Barra', weightKg: 62.5, date: '22 Sep', icon: 'shield-checkmark' },
];

export const DEFAULT_WEIGHT_LOG: WeightEntry[] = [
  { id: 'w1', weightKg: 78.4, date: 'Hoy, 08:30' },
  { id: 'w2', weightKg: 78.8, date: 'Hace 3 días' },
  { id: 'w3', weightKg: 79.2, date: 'Hace 1 semana' },
  { id: 'w4', weightKg: 80.0, date: 'Hace 2 semanas' },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Atleta Fitness',
  level: 'Nivel Intermedio',
  goal: 'Hipertrofia',
  sessions: 48,
  volumeTon: 14.5,
  streakDays: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  useKg: true,
};

const STORAGE_KEYS = {
  ROUTINES: '@gymfit_routines',
  PRS: '@gymfit_prs',
  WEIGHT: '@gymfit_weight',
  PROFILE: '@gymfit_profile',
  VIDEOS: '@gymfit_recent_videos',
};

const FIRESTORE_COLLECTION = 'gymfit_data';
const MAX_RECENT_VIDEOS = 10;

const getUserStorageKey = (key: string): string => {
  const userId = getCurrentUserId();
  return userId ? `${key}:${userId}` : `${key}:guest`;
};
const getUserDocument = (documentId: string, userId: string) => {
  if (!db) {
    throw new Error('Firestore no está disponible.');
  }
  return doc(db, 'users', userId, FIRESTORE_COLLECTION, documentId);
};

const reportStorageError = (message: string, error: unknown): void => {
  console.error(message, error);
};

export const getRecentVideos = async (): Promise<WatchedVideo[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const storedVideos = await AsyncStorage.getItem(`${STORAGE_KEYS.VIDEOS}:${userId}`);
  if (!storedVideos) return [];

  const parsedVideos: unknown = JSON.parse(storedVideos);
  if (!Array.isArray(parsedVideos)) {
    throw new Error('El historial de videos guardado no tiene un formato válido.');
  }

  return parsedVideos.filter(
    (video): video is WatchedVideo =>
      typeof video?.videoId === 'string' &&
      typeof video?.exerciseName === 'string' &&
      typeof video?.watchedAt === 'string'
  ).slice(0, MAX_RECENT_VIDEOS);
};

export const saveRecentVideo = async (video: WatchedVideo): Promise<WatchedVideo[]> => {
  if (!getCurrentUserId()) return [];
  const recentVideos = await getRecentVideos();
  const updatedVideos = [
    video,
    ...recentVideos.filter((recentVideo) => recentVideo.videoId !== video.videoId),
  ].slice(0, MAX_RECENT_VIDEOS);

  await AsyncStorage.setItem(getUserStorageKey(STORAGE_KEYS.VIDEOS), JSON.stringify(updatedVideos));
  return updatedVideos;
};

export const isCloudSyncActive = (): boolean => {
  return isFirebaseConfigured() && db !== null && Boolean(authenticatedUserId());
};

const authenticatedUserId = (): string | null => getCurrentUserId();

const subscribeUserData = <T,>(
  documentId: string,
  storageKey: string,
  fallback: T,
  callback: (value: T) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  let active = true;
  let unsubscribeRemote: Unsubscribe | null = null;
  const handleError = (error: unknown) => {
    if (onError) onError(error);
    else reportStorageError(`[GymFit] Error cargando ${documentId}:`, error);
  };

  const loadUserData = (user: User | null) => {
    unsubscribeRemote?.();
    unsubscribeRemote = null;
    if (!active) return;
    if (!user) {
      callback(fallback);
      return;
    }

    const localKey = `${storageKey}:${user.uid}`;
    AsyncStorage.getItem(localKey)
      .then((local) => {
        if (!active || auth?.currentUser?.uid !== user.uid) return;
        if (!local) {
          callback(fallback);
          return;
        }
        try {
          callback(JSON.parse(local) as T);
        } catch (error) {
          handleError(error);
        }
      })
      .catch(handleError);

    if (!isCloudSyncActive() || !db) return;
    unsubscribeRemote = onSnapshot(
      getUserDocument(documentId, user.uid),
      (docSnap) => {
        if (!active || auth?.currentUser?.uid !== user.uid || !docSnap.exists()) return;
        const data = docSnap.data();
        const remoteValue = documentId === 'profile' ? data as T : data.items as T;
        if (remoteValue === undefined) return;
        AsyncStorage.setItem(localKey, JSON.stringify(remoteValue))
          .then(() => {
            if (active && auth?.currentUser?.uid === user.uid) callback(remoteValue);
          })
          .catch(handleError);
      },
      handleError
    );
  };

  if (!auth) {
    callback(fallback);
    return () => {
      active = false;
    };
  }

  const unsubscribeAuth = onAuthStateChanged(auth, loadUserData, handleError);
  return () => {
    active = false;
    unsubscribeRemote?.();
    unsubscribeAuth();
  };
};

const saveUserData = async <T,>(
  documentId: string,
  storageKey: string,
  value: T,
  profileDocument = false
): Promise<void> => {
  const userId = getAuthenticatedUserId();
  const localKey = `${storageKey}:${userId}`;
  await AsyncStorage.setItem(localKey, JSON.stringify(value));

  if (!isCloudSyncActive() || !db) return;
  const data = profileDocument
    ? { ...(value as UserProfile), updatedAt: new Date().toISOString() }
    : { items: value, updatedAt: new Date().toISOString() };
  try {
    await setDoc(getUserDocument(documentId, userId), data, { merge: true });
  } catch (error) {
    reportStorageError(`[Firestore] Error guardando ${documentId}:`, error);
  }
};

// ================= Rutinas =================
export const subscribeRoutines = (callback: (routines: Routine[]) => void): (() => void) =>
  subscribeUserData('routines', STORAGE_KEYS.ROUTINES, DEFAULT_ROUTINES, callback);

export const saveRoutines = (routines: Routine[]): Promise<void> =>
  saveUserData('routines', STORAGE_KEYS.ROUTINES, routines);

// ================= Récords Personales (PRs) =================
export const subscribePRs = (callback: (prs: PersonalRecord[]) => void): (() => void) =>
  subscribeUserData('prs', STORAGE_KEYS.PRS, DEFAULT_PRS, callback);

export const savePRs = (prs: PersonalRecord[]): Promise<void> =>
  saveUserData('prs', STORAGE_KEYS.PRS, prs);

// ================= Registro de Peso =================
export const subscribeWeightLog = (callback: (log: WeightEntry[]) => void): (() => void) =>
  subscribeUserData('weight', STORAGE_KEYS.WEIGHT, DEFAULT_WEIGHT_LOG, callback);

export const saveWeightLog = (log: WeightEntry[]): Promise<void> =>
  saveUserData('weight', STORAGE_KEYS.WEIGHT, log);

// ================= Perfil y Ajustes =================
export const subscribeProfile = (callback: (profile: UserProfile) => void): (() => void) =>
  subscribeUserData('profile', STORAGE_KEYS.PROFILE, DEFAULT_PROFILE, callback);

export const saveProfile = (profile: UserProfile): Promise<void> =>
  saveUserData('profile', STORAGE_KEYS.PROFILE, profile, true);
