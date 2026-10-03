import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

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
};

const FIRESTORE_COLLECTION = 'gymfit_data';
const USER_DOC_ID = 'default_athlete';

export const isCloudSyncActive = (): boolean => {
  return isFirebaseConfigured() && db !== null;
};

// ================= Rutinas =================
export const subscribeRoutines = (callback: (routines: Routine[]) => void): (() => void) => {
  // 1. Cargar cache local inmediatamente
  AsyncStorage.getItem(STORAGE_KEYS.ROUTINES).then((local) => {
    if (local) {
      try {
        callback(JSON.parse(local));
      } catch {}
    } else {
      callback(DEFAULT_ROUTINES);
    }
  });

  // 2. Si Firestore está activo, escuchar cambios en tiempo real
  if (isCloudSyncActive() && db) {
    const routineDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_routines`);
    const unsubscribe: Unsubscribe = onSnapshot(
      routineDocRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.items) {
          const remoteRoutines = docSnap.data().items as Routine[];
          AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(remoteRoutines));
          callback(remoteRoutines);
        }
      },
      (err) => console.warn('[Firestore] Error en snapshot de rutinas:', err)
    );
    return unsubscribe;
  }

  return () => {};
};

export const saveRoutines = async (routines: Routine[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));

  if (isCloudSyncActive() && db) {
    try {
      const routineDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_routines`);
      await setDoc(routineDocRef, { items: routines, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error guardando rutinas:', err);
    }
  }
};

// ================= Récords Personales (PRs) =================
export const subscribePRs = (callback: (prs: PersonalRecord[]) => void): (() => void) => {
  AsyncStorage.getItem(STORAGE_KEYS.PRS).then((local) => {
    if (local) {
      try {
        callback(JSON.parse(local));
      } catch {}
    } else {
      callback(DEFAULT_PRS);
    }
  });

  if (isCloudSyncActive() && db) {
    const prDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_prs`);
    const unsubscribe: Unsubscribe = onSnapshot(
      prDocRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.items) {
          const remotePRs = docSnap.data().items as PersonalRecord[];
          AsyncStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(remotePRs));
          callback(remotePRs);
        }
      },
      (err) => console.warn('[Firestore] Error en snapshot de PRs:', err)
    );
    return unsubscribe;
  }

  return () => {};
};

export const savePRs = async (prs: PersonalRecord[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));

  if (isCloudSyncActive() && db) {
    try {
      const prDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_prs`);
      await setDoc(prDocRef, { items: prs, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error guardando PRs:', err);
    }
  }
};

// ================= Registro de Peso =================
export const subscribeWeightLog = (callback: (log: WeightEntry[]) => void): (() => void) => {
  AsyncStorage.getItem(STORAGE_KEYS.WEIGHT).then((local) => {
    if (local) {
      try {
        callback(JSON.parse(local));
      } catch {}
    } else {
      callback(DEFAULT_WEIGHT_LOG);
    }
  });

  if (isCloudSyncActive() && db) {
    const weightDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_weight`);
    const unsubscribe: Unsubscribe = onSnapshot(
      weightDocRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.items) {
          const remoteWeight = docSnap.data().items as WeightEntry[];
          AsyncStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(remoteWeight));
          callback(remoteWeight);
        }
      },
      (err) => console.warn('[Firestore] Error en snapshot de peso:', err)
    );
    return unsubscribe;
  }

  return () => {};
};

export const saveWeightLog = async (log: WeightEntry[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(log));

  if (isCloudSyncActive() && db) {
    try {
      const weightDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_weight`);
      await setDoc(weightDocRef, { items: log, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error guardando peso:', err);
    }
  }
};

// ================= Perfil y Ajustes =================
export const subscribeProfile = (callback: (profile: UserProfile) => void): (() => void) => {
  AsyncStorage.getItem(STORAGE_KEYS.PROFILE).then((local) => {
    if (local) {
      try {
        callback(JSON.parse(local));
      } catch {}
    } else {
      callback(DEFAULT_PROFILE);
    }
  });

  if (isCloudSyncActive() && db) {
    const profileDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_profile`);
    const unsubscribe: Unsubscribe = onSnapshot(
      profileDocRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data()) {
          const remoteProfile = docSnap.data() as UserProfile;
          AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(remoteProfile));
          callback(remoteProfile);
        }
      },
      (err) => console.warn('[Firestore] Error en snapshot de perfil:', err)
    );
    return unsubscribe;
  }

  return () => {};
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

  if (isCloudSyncActive() && db) {
    try {
      const profileDocRef = doc(db, FIRESTORE_COLLECTION, `${USER_DOC_ID}_profile`);
      await setDoc(profileDocRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error guardando perfil:', err);
    }
  }
};
