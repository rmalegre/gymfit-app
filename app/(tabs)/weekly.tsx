import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  Equipment,
  PlannedExercise,
  TrainingDay,
  TrainingGoal,
  TrainingLevel,
  WeeklyPlan,
  loadWeeklyPlan,
  saveWeeklyPlan,
} from '@/services/weeklyPlan';
import { auth } from '@/services/firebase';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const LEVELS: TrainingLevel[] = ['Principiante', 'Intermedio', 'Avanzado'];
const GOALS: TrainingGoal[] = ['Hipertrofia', 'Fuerza', 'Acondicionamiento'];
const EQUIPMENT: Equipment[] = ['Gimnasio', 'Casa'];

type ExerciseOption = { name: string; muscle: string; gym: string; home: string };

const MOVEMENTS: Record<string, ExerciseOption> = {
  squat: { name: 'Sentadilla', muscle: 'Piernas', gym: 'Sentadilla con barra', home: 'Sentadilla con peso corporal' },
  hinge: { name: 'Bisagra de cadera', muscle: 'Isquios y glúteos', gym: 'Peso muerto rumano', home: 'Peso muerto rumano con mochila' },
  press: { name: 'Empuje horizontal', muscle: 'Pecho', gym: 'Press de banca', home: 'Flexiones' },
  incline: { name: 'Empuje inclinado', muscle: 'Pecho y hombros', gym: 'Press inclinado con mancuernas', home: 'Flexiones inclinadas' },
  row: { name: 'Tracción horizontal', muscle: 'Espalda', gym: 'Remo sentado en polea', home: 'Remo con mochila' },
  pull: { name: 'Tracción vertical', muscle: 'Espalda', gym: 'Jalón al pecho', home: 'Remo invertido bajo mesa' },
  overhead: { name: 'Empuje vertical', muscle: 'Hombros', gym: 'Press militar con mancuernas', home: 'Press de hombros con mochila' },
  lateral: { name: 'Elevación lateral', muscle: 'Hombros', gym: 'Elevaciones laterales', home: 'Elevaciones laterales con botellas' },
  lunge: { name: 'Unilateral de piernas', muscle: 'Piernas y glúteos', gym: 'Zancadas con mancuernas', home: 'Zancadas' },
  hip: { name: 'Extensión de cadera', muscle: 'Glúteos', gym: 'Hip thrust', home: 'Puente de glúteos' },
  triceps: { name: 'Extensión de brazos', muscle: 'Tríceps', gym: 'Extensión de tríceps en polea', home: 'Flexiones con manos juntas' },
  biceps: { name: 'Flexión de brazos', muscle: 'Bíceps', gym: 'Curl de bíceps con mancuernas', home: 'Curl con mochila' },
  core: { name: 'Estabilidad del tronco', muscle: 'Core', gym: 'Plancha', home: 'Plancha' },
  calf: { name: 'Elevación de talones', muscle: 'Pantorrillas', gym: 'Gemelos de pie', home: 'Elevación de talones' },
};

const SPLITS: Record<number, string[]> = {
  2: ['Full body A', 'Full body B'],
  3: ['Full body A', 'Full body B', 'Full body C'],
  4: ['Tren superior', 'Tren inferior', 'Tren superior', 'Tren inferior'],
  5: ['Empuje', 'Tracción', 'Piernas', 'Tren superior', 'Tren inferior'],
  6: ['Empuje', 'Tracción', 'Piernas', 'Empuje', 'Tracción', 'Piernas'],
};

const FOCUS_MOVEMENTS: Record<string, string[]> = {
  'Full body A': ['squat', 'press', 'row', 'hinge', 'core'],
  'Full body B': ['hinge', 'overhead', 'pull', 'lunge', 'core'],
  'Full body C': ['lunge', 'incline', 'row', 'hip', 'calf'],
  'Tren superior': ['press', 'row', 'overhead', 'pull', 'biceps'],
  'Tren inferior': ['squat', 'hinge', 'lunge', 'hip', 'calf'],
  Empuje: ['press', 'incline', 'overhead', 'lateral', 'triceps'],
  Tracción: ['row', 'pull', 'hinge', 'biceps', 'core'],
  Piernas: ['squat', 'hinge', 'lunge', 'hip', 'calf'],
};

function makePlan(
  level: TrainingLevel,
  goal: TrainingGoal,
  equipment: Equipment,
  days: string[]
): WeeklyPlan {
  const split = SPLITS[days.length];
  const sets = level === 'Principiante' ? 2 : level === 'Intermedio' ? 3 : 4;
  const reps = goal === 'Fuerza' ? '5–8' : goal === 'Hipertrofia' ? '8–12' : '10–15';
  const restSec = goal === 'Fuerza' ? 150 : goal === 'Hipertrofia' ? 90 : 60;

  const planDays: TrainingDay[] = days.map((day, dayIndex) => {
    const focus = split[dayIndex];
    const exercises: PlannedExercise[] = FOCUS_MOVEMENTS[focus].map((key, exerciseIndex) => {
      const movement = MOVEMENTS[key];
      return {
        id: `${day}-${dayIndex}-${exerciseIndex}`,
        name: equipment === 'Casa' ? movement.home : movement.gym,
        muscle: movement.muscle,
        sets,
        reps,
        restSec,
        completed: false,
      };
    });
    return { day, focus, exercises };
  });

  return { level, goal, equipment, createdAt: new Date().toISOString(), days: planDays };
}

export default function WeeklyPlanScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [level, setLevel] = useState<TrainingLevel>('Principiante');
  const [goal, setGoal] = useState<TrainingGoal>('Hipertrofia');
  const [equipment, setEquipment] = useState<Equipment>('Gimnasio');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lun', 'Mié', 'Vie']);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      loadWeeklyPlan()
        .then((storedPlan) => {
          if (!mounted) return;
          if (!storedPlan) {
            if (saved) {
              setPlan(null);
              setSaved(false);
            }
            return;
          }
          setPlan(storedPlan);
          setLevel(storedPlan.level);
          setGoal(storedPlan.goal);
          setEquipment(storedPlan.equipment);
          setSelectedDays(storedPlan.days.map((day) => day.day));
          setSaved(true);
        })
        .catch((error) => console.warn('[Rutina semanal] No se pudo cargar:', error));
      return () => { mounted = false; };
    }, [saved])
  );

  const toggleDay = (day: string) => {
    setSelectedDays((current) => {
      if (current.includes(day)) return current.length > 2 ? current.filter((item) => item !== day) : current;
      return current.length < 6 ? WEEKDAYS.filter((item) => current.includes(item) || item === day) : current;
    });
    setSaved(false);
  };

  const createPlan = () => {
    const orderedDays = WEEKDAYS.filter((day) => selectedDays.includes(day));
    setPlan(makePlan(level, goal, equipment, orderedDays));
    setSaved(false);
  };

  const savePlan = async () => {
    if (!plan) return;
    if (!auth?.currentUser) {
      Alert.alert(
        'Inicia sesión para guardar',
        'Puedes crear y consultar el plan sin una cuenta. Inicia sesión para guardarlo en tu perfil.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/sign-in') },
        ]
      );
      return;
    }
    try {
      await saveWeeklyPlan(plan);
      setSaved(true);
    } catch (error) {
      console.error('[Rutina semanal] No se pudo guardar:', error);
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.');
    }
  };

  const toggleExercise = (dayIndex: number, exerciseId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      days: plan.days.map((day, index) => index !== dayIndex ? day : {
        ...day,
        exercises: day.exercises.map((exercise) => exercise.id === exerciseId
          ? { ...exercise, completed: !exercise.completed }
          : exercise),
      }),
    });
    setSaved(false);
  };

  const completed = plan?.days.reduce((sum, day) => sum + day.exercises.filter((exercise) => exercise.completed).length, 0) ?? 0;
  const exerciseCount = plan?.days.reduce((sum, day) => sum + day.exercises.length, 0) ?? 0;

  const renderChoices = <T extends string>(
    options: T[],
    value: T,
    onSelect: (option: T) => void
  ) => (
    <View style={styles.choiceRow}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => { onSelect(option); setSaved(false); }}
            style={[styles.choice, { backgroundColor: active ? theme.tint : theme.card, borderColor: active ? theme.tint : theme.cardBorder }]}
          >
            <Text style={[styles.choiceText, { color: active ? '#061006' : theme.subtext }]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: theme.tint }]}>TU PLAN, TU RITMO</Text>
        <Text style={[styles.title, { color: theme.text }]}>Rutina semanal</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Arma una semana que se adapte a tu experiencia, objetivo y tiempo.</Text>
      </View>

      <View style={[styles.builderCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.sectionHeading}>
          <View style={[styles.sectionIcon, { backgroundColor: `${theme.tint}20` }]}>
            <Ionicons name="options-outline" size={19} color={theme.tint} />
          </View>
          <View style={styles.sectionText}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Personaliza tu semana</Text>
            <Text style={[styles.helper, { color: theme.subtext }]}>Puedes cambiar estos datos cuando quieras.</Text>
          </View>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Tu nivel</Text>
        {renderChoices(LEVELS, level, setLevel)}

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Objetivo</Text>
        {renderChoices(GOALS, goal, setGoal)}

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Dónde entrenas</Text>
        {renderChoices(EQUIPMENT, equipment, setEquipment)}

        <View style={styles.dayLabelRow}>
          <Text style={[styles.fieldLabel, { color: theme.text, marginBottom: 0 }]}>Días disponibles</Text>
          <Text style={[styles.dayCount, { color: theme.tint }]}>{selectedDays.length} días</Text>
        </View>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => {
            const active = selectedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                onPress={() => toggleDay(day)}
                style={[styles.weekday, { backgroundColor: active ? theme.tint : theme.background, borderColor: active ? theme.tint : theme.cardBorder }]}
                accessibilityRole="button"
                accessibilityLabel={`${day}${active ? ', seleccionado' : ', no seleccionado'}`}
              >
                <Text style={[styles.weekdayText, { color: active ? '#061006' : theme.subtext }]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.generateButton, { backgroundColor: theme.tint }]} onPress={createPlan}>
          <Ionicons name="sparkles" size={19} color="#061006" />
          <Text style={styles.generateText}>{plan ? 'Actualizar mi rutina' : 'Crear mi rutina'}</Text>
        </TouchableOpacity>
      </View>

      {plan && (
        <View style={styles.planSection}>
          <View style={styles.planTitleRow}>
            <View style={styles.planTitleText}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Tu semana de entrenamiento</Text>
              <Text style={[styles.helper, { color: theme.subtext }]}>{plan.level} · {plan.goal} · {plan.equipment}</Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: `${theme.tint}20` }]}>
              <Text style={[styles.progressText, { color: theme.tint }]}>{completed}/{exerciseCount}</Text>
            </View>
          </View>

          {plan.days.map((day, dayIndex) => (
            <View key={`${day.day}-${day.focus}`} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.dayCardHeader}>
                <View style={[styles.dayPill, { backgroundColor: `${theme.tint}20` }]}>
                  <Text style={[styles.dayPillText, { color: theme.tint }]}>{day.day}</Text>
                </View>
                <View style={styles.dayFocusWrap}>
                  <Text style={[styles.dayFocus, { color: theme.text }]}>{day.focus}</Text>
                  <Text style={[styles.helper, { color: theme.subtext }]}>{plan.level === 'Principiante' ? 'Empieza suave y prioriza la técnica' : 'Controla el movimiento en cada repetición'}</Text>
                </View>
                <Ionicons name="barbell-outline" size={21} color={theme.tint} />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
              {day.exercises.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  theme={theme}
                  onPress={() => toggleExercise(dayIndex, exercise.id)}
                />
              ))}
            </View>
          ))}

          <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="leaf-outline" size={20} color={theme.tint} />
            <Text style={[styles.tipText, { color: theme.subtext }]}>Deja al menos un día de recuperación entre sesiones exigentes. Si recién empiezas, usa una carga cómoda y detén el ejercicio si sientes dolor.</Text>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: saved ? theme.card : theme.tint, borderColor: theme.tint }]} onPress={savePlan}>
            <Ionicons name={saved ? 'checkmark-circle-outline' : 'save-outline'} size={19} color={saved ? theme.tint : '#061006'} />
            <Text style={[styles.saveText, { color: saved ? theme.tint : '#061006' }]}>{saved ? 'Semana guardada' : 'Guardar mi semana'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.coachNote, { borderColor: theme.cardBorder }]}>
        <Ionicons name="bulb-outline" size={18} color={theme.tint} />
        <Text style={[styles.coachNoteText, { color: theme.subtext }]}>La rutina se adapta a tus elecciones. La generación con IA puede añadirse más adelante mediante un servicio seguro.</Text>
      </View>
    </ScrollView>
  );
}

function ExerciseRow({
  exercise,
  theme,
  onPress,
}: {
  exercise: PlannedExercise;
  theme: typeof Colors.dark;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.exerciseRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.check, { borderColor: exercise.completed ? theme.tint : theme.cardBorder, backgroundColor: exercise.completed ? theme.tint : 'transparent' }]}>
        {exercise.completed && <Ionicons name="checkmark" size={13} color="#061006" />}
      </View>
      <View style={styles.exerciseNameWrap}>
        <Text style={[styles.exerciseName, { color: exercise.completed ? theme.subtext : theme.text, textDecorationLine: exercise.completed ? 'line-through' : 'none' }]}>{exercise.name}</Text>
        <Text style={[styles.exerciseMuscle, { color: theme.subtext }]}>{exercise.muscle}</Text>
      </View>
      <View style={styles.exerciseNumbers}>
        <Text style={[styles.exerciseSets, { color: theme.text }]}>{exercise.sets} × {exercise.reps}</Text>
        <Text style={[styles.exerciseRest, { color: theme.subtext }]}>{exercise.restSec}s descanso</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  heading: { marginBottom: 18, backgroundColor: 'transparent' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  builderCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: 'transparent' },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  sectionText: { flex: 1, backgroundColor: 'transparent' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  helper: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: 'transparent' },
  choice: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 18 },
  choiceText: { fontSize: 12, fontWeight: '700' },
  dayLabelRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent' },
  dayCount: { fontSize: 12, fontWeight: '800' },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, backgroundColor: 'transparent' },
  weekday: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  weekdayText: { fontSize: 11, fontWeight: '800' },
  generateButton: { minHeight: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, marginTop: 20 },
  generateText: { color: '#061006', fontSize: 14, fontWeight: '900' },
  planSection: { backgroundColor: 'transparent' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, backgroundColor: 'transparent' },
  planTitleText: { flex: 1, backgroundColor: 'transparent' },
  progressBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, marginLeft: 10 },
  progressText: { fontSize: 12, fontWeight: '900' },
  dayCard: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4, marginBottom: 12 },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' },
  dayPill: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  dayPillText: { fontSize: 12, fontWeight: '900' },
  dayFocusWrap: { flex: 1, backgroundColor: 'transparent' },
  dayFocus: { fontSize: 14, fontWeight: '800' },
  divider: { height: 1, marginTop: 12, marginBottom: 3 },
  exerciseRow: { minHeight: 57, flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: 'transparent' },
  check: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  exerciseNameWrap: { flex: 1, backgroundColor: 'transparent' },
  exerciseName: { fontSize: 12, fontWeight: '700' },
  exerciseMuscle: { fontSize: 10, marginTop: 2 },
  exerciseNumbers: { alignItems: 'flex-end', marginLeft: 7, backgroundColor: 'transparent' },
  exerciseSets: { fontSize: 11, fontWeight: '800' },
  exerciseRest: { fontSize: 9, marginTop: 2 },
  tipCard: { borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 4, marginBottom: 12 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 17 },
  saveButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveText: { fontSize: 14, fontWeight: '900' },
  coachNote: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 20 },
  coachNoteText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
