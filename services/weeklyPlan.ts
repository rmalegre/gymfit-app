import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, getAuthenticatedUserId, getCurrentUserId, isFirebaseConfigured } from './firebase';

export type TrainingLevel = 'Principiante' | 'Intermedio' | 'Avanzado';
export type TrainingGoal = 'Hipertrofia' | 'Fuerza' | 'Acondicionamiento';
export type Equipment = 'Gimnasio' | 'Casa';

export interface PlannedExercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  restSec: number;
  completed: boolean;
}

export interface TrainingDay {
  day: string;
  focus: string;
  exercises: PlannedExercise[];
}

export interface WeeklyPlan {
  level: TrainingLevel;
  goal: TrainingGoal;
  equipment: Equipment;
  createdAt?: string;
  days: TrainingDay[];
}

const WEEKLY_PLAN_COLLECTION = 'gymfit_data';
const WEEKLY_PLAN_DOCUMENT = 'weekly_plan';
type StoredWeeklyPlan = WeeklyPlan & { updatedAt?: string };

function isWeeklyPlan(value: unknown): value is StoredWeeklyPlan {
  if (typeof value !== 'object' || value === null) return false;

  const plan = value as Partial<StoredWeeklyPlan>;
  return (
    ['Principiante', 'Intermedio', 'Avanzado'].includes(plan.level ?? '') &&
    ['Hipertrofia', 'Fuerza', 'Acondicionamiento'].includes(plan.goal ?? '') &&
    ['Gimnasio', 'Casa'].includes(plan.equipment ?? '') &&
    (!('createdAt' in plan) || typeof plan.createdAt === 'string') &&
    Array.isArray(plan.days) &&
    plan.days.length <= 7 &&
    (!('updatedAt' in plan) || typeof plan.updatedAt === 'string')
  );
}

async function loadLocalWeeklyPlan(userId: string): Promise<WeeklyPlan | null> {
  const saved = await AsyncStorage.getItem(`@gymfit_weekly_plan:${userId}`);
  if (!saved) return null;

  try {
    const value: unknown = JSON.parse(saved);
    return isWeeklyPlan(value) ? value : null;
  } catch {
    return null;
  }
}

export async function loadWeeklyPlan(): Promise<WeeklyPlan | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const localPlan = await loadLocalWeeklyPlan(userId);
  if (isFirebaseConfigured() && db) {
    try {
      const planRef = doc(db, 'users', userId, WEEKLY_PLAN_COLLECTION, WEEKLY_PLAN_DOCUMENT);
      const snapshot = await getDoc(planRef);
      if (snapshot.exists()) {
        const remotePlan: unknown = snapshot.data();
        if (!isWeeklyPlan(remotePlan) || typeof remotePlan.updatedAt !== 'string') {
          throw new Error('El plan semanal de Firestore tiene un formato inválido.');
        }
        const plan: WeeklyPlan = remotePlan;
        await AsyncStorage.setItem(`@gymfit_weekly_plan:${userId}`, JSON.stringify(plan));
        return plan;
      }
      if (localPlan) {
        await setDoc(planRef, { ...localPlan, updatedAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error('[Firestore] No se pudo cargar weekly_plan; se usará la copia local:', error);
    }
  }

  return localPlan;
}

export async function saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
  const userId = getAuthenticatedUserId();
  await AsyncStorage.setItem(`@gymfit_weekly_plan:${userId}`, JSON.stringify(plan));

  if (!isFirebaseConfigured() || !db) return;

  const updatedAt = new Date().toISOString();
  const planRef = doc(db, 'users', userId, WEEKLY_PLAN_COLLECTION, WEEKLY_PLAN_DOCUMENT);
  await setDoc(planRef, { ...plan, updatedAt });
}
