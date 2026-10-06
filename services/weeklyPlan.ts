import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthenticatedUserId, getCurrentUserId } from './firebase';

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
  createdAt: string;
  days: TrainingDay[];
}

export async function loadWeeklyPlan(): Promise<WeeklyPlan | null> {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const saved = await AsyncStorage.getItem(`@gymfit_weekly_plan:${userId}`);
  if (!saved) return null;

  try {
    const value: unknown = JSON.parse(saved);
    if (
      typeof value === 'object' && value !== null &&
      'days' in value && Array.isArray(value.days) &&
      'level' in value && 'goal' in value && 'equipment' in value
    ) {
      return value as WeeklyPlan;
    }
  } catch {
    return null;
  }

  return null;
}

export async function saveWeeklyPlan(plan: WeeklyPlan): Promise<void> {
  const userId = getAuthenticatedUserId();
  await AsyncStorage.setItem(`@gymfit_weekly_plan:${userId}`, JSON.stringify(plan));
}
