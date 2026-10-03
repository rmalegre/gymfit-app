import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  Routine,
  Exercise,
  DEFAULT_ROUTINES,
  subscribeRoutines,
  saveRoutines,
} from '@/services/gymStorage';
import { SyncBadge } from '@/components/SyncBadge';

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [routines, setRoutines] = useState<Routine[]>(DEFAULT_ROUTINES);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('chest_triceps');

  // Modal para añadir ejercicio
  const [modalVisible, setModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [newSets, setNewSets] = useState('3');
  const [newReps, setNewReps] = useState('10');
  const [newWeight, setNewWeight] = useState('20');

  useEffect(() => {
    const unsubscribe = subscribeRoutines((data) => {
      if (data && data.length > 0) {
        setRoutines(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateRoutinesAndPersist = (updater: (prev: Routine[]) => Routine[]) => {
    setRoutines((prev) => {
      const next = updater(prev);
      saveRoutines(next);
      return next;
    });
  };

  const currentRoutine = routines.find((r) => r.id === selectedRoutineId) ?? routines[0];
  const completedCount = currentRoutine ? currentRoutine.exercises.filter((e) => e.completed).length : 0;
  const totalCount = currentRoutine ? currentRoutine.exercises.length : 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleExercise = (exerciseId: string) => {
    updateRoutinesAndPersist((prev) =>
      prev.map((routine) => {
        if (routine.id !== selectedRoutineId) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
          ),
        };
      })
    );
  };

  const updateWeight = (exerciseId: string, delta: number) => {
    updateRoutinesAndPersist((prev) =>
      prev.map((routine) => {
        if (routine.id !== selectedRoutineId) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) =>
            ex.id === exerciseId
              ? { ...ex, weightKg: Math.max(0, ex.weightKg + delta) }
              : ex
          ),
        };
      })
    );
  };

  const openExerciseVideo = async (exerciseName: string) => {
    const query = `${exerciseName} técnica correcta tutorial corto shorts`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('[Videos] No se pudo abrir YouTube:', error);
      Alert.alert('No se pudo abrir YouTube', 'Comprueba tu conexión e inténtalo de nuevo.');
    }
  };

  const resetProgress = () => {
    Alert.alert(
      'Reiniciar Rutina',
      '¿Deseas desmarcar todos los ejercicios completados de esta rutina?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            updateRoutinesAndPersist((prev) =>
              prev.map((routine) =>
                routine.id === selectedRoutineId
                  ? {
                      ...routine,
                      exercises: routine.exercises.map((e) => ({ ...e, completed: false })),
                    }
                  : routine
              )
            );
          },
        },
      ]
    );
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del ejercicio');
      return;
    }

    const newEx: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName.trim(),
      muscle: newMuscle.trim() || 'General',
      sets: parseInt(newSets, 10) || 3,
      reps: newReps.trim() || '10',
      weightKg: parseFloat(newWeight) || 0,
      completed: false,
    };

    updateRoutinesAndPersist((prev) =>
      prev.map((routine) =>
        routine.id === selectedRoutineId
          ? { ...routine, exercises: [...routine.exercises, newEx] }
          : routine
      )
    );

    setNewExerciseName('');
    setNewMuscle('');
    setNewSets('3');
    setNewReps('10');
    setNewWeight('20');
    setModalVisible(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Bienvenida */}
      <View style={[styles.headerBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.bannerRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[styles.greeting, { color: theme.subtext }]}>¡VAMOS CON TODO HOY! 💪</Text>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Entrenamiento del Día</Text>
          </View>
          <View style={styles.badgeGroup}>
            <SyncBadge />
            <View style={[styles.flameBadge, { backgroundColor: theme.tint + '20' }]}>
              <Ionicons name="flame" size={16} color={theme.tint} />
              <Text style={[styles.flameText, { color: theme.tint }]}>5d</Text>
            </View>
          </View>
        </View>

        {/* Barra de progreso de la rutina */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>
              Progreso: {completedCount} de {totalCount} ejercicios
            </Text>
            <Text style={[styles.progressPercent, { color: theme.tint }]}>{progressPercent}%</Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.cardBorder }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: theme.tint },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Selector de Rutinas */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Selecciona tu Rutina</Text>
        <TouchableOpacity onPress={resetProgress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.resetText, { color: theme.subtext }]}>Reiniciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routineSelectorScroll}>
        {routines.map((routine) => {
          const isSelected = routine.id === selectedRoutineId;
          return (
            <TouchableOpacity
              key={routine.id}
              style={[
                styles.routinePill,
                {
                  backgroundColor: isSelected ? theme.tint : theme.card,
                  borderColor: isSelected ? theme.tint : theme.cardBorder,
                },
              ]}
              onPress={() => setSelectedRoutineId(routine.id)}
            >
              <Ionicons
                name="barbell-outline"
                size={16}
                color={isSelected ? '#FFFFFF' : theme.subtext}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.routinePillText,
                  { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {routine.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Info Rutina seleccionada */}
      {currentRoutine && (
        <View style={[styles.routineMetaCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={theme.subtext} />
            <Text style={[styles.metaText, { color: theme.subtext }]}>{currentRoutine.durationMin} minutos</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="speedometer-outline" size={16} color={theme.subtext} />
            <Text style={[styles.metaText, { color: theme.subtext }]}>Intensidad: {currentRoutine.intensity}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="fitness-outline" size={16} color={theme.subtext} />
            <Text style={[styles.metaText, { color: theme.subtext }]}>{currentRoutine.exercises.length} Ejercicios</Text>
          </View>
        </View>
      )}

      {/* Lista de Ejercicios */}
      <View style={styles.exercisesHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ejercicios de la Rutina</Text>
        <TouchableOpacity
          style={[styles.addExerciseButton, { backgroundColor: theme.tint }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addExerciseButtonText}>Añadir</Text>
        </TouchableOpacity>
      </View>

      {currentRoutine?.exercises.map((exercise) => {
        return (
          <View
            key={exercise.id}
            style={[
              styles.exerciseCard,
              {
                backgroundColor: theme.card,
                borderColor: exercise.completed ? theme.tint : theme.cardBorder,
                borderWidth: exercise.completed ? 1.5 : 1,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.exerciseCardTop}
              onPress={() => toggleExercise(exercise.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkCircle,
                  {
                    borderColor: exercise.completed ? theme.tint : theme.subtext,
                    backgroundColor: exercise.completed ? theme.tint : 'transparent',
                  },
                ]}
              >
                {exercise.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>

              <View style={styles.exerciseInfoContainer}>
                <Text
                  style={[
                    styles.exerciseTitle,
                    {
                      color: exercise.completed ? theme.subtext : theme.text,
                      textDecorationLine: exercise.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {exercise.name}
                </Text>
                <Text style={[styles.exerciseMuscle, { color: theme.subtext }]}>{exercise.muscle}</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.exerciseBottomRow, { borderTopColor: theme.cardBorder }]}>
              <View style={styles.exerciseMetricBadge}>
                <Text style={[styles.metricLabel, { color: theme.subtext }]}>Series x Reps</Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {exercise.sets} × {exercise.reps}
                </Text>
              </View>

              <View style={styles.weightControls}>
                <Text style={[styles.metricLabel, { color: theme.subtext }]}>Carga (Kg)</Text>
                <View style={styles.weightButtonRow}>
                  <TouchableOpacity
                    style={[styles.weightBtn, { backgroundColor: theme.cardBorder }]}
                    onPress={() => updateWeight(exercise.id, -2.5)}
                  >
                    <Ionicons name="remove" size={16} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.weightText, { color: theme.tint }]}>{exercise.weightKg} kg</Text>
                  <TouchableOpacity
                    style={[styles.weightBtn, { backgroundColor: theme.cardBorder }]}
                    onPress={() => updateWeight(exercise.id, 2.5)}
                  >
                    <Ionicons name="add" size={16} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.exerciseVideoButton, { borderTopColor: theme.cardBorder }]}
              onPress={() => openExerciseVideo(exercise.name)}
              accessibilityRole="button"
              accessibilityLabel={`Buscar video de técnica para ${exercise.name} en YouTube`}
            >
              <Ionicons name="play-circle-outline" size={20} color={theme.tint} />
              <Text style={[styles.exerciseVideoText, { color: theme.tint }]}>Buscar video de técnica</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Modal para añadir nuevo ejercicio */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Añadir Ejercicio</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.text }]}>Nombre del Ejercicio</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
              placeholder="Ej. Press Militar con Barra"
              placeholderTextColor={theme.subtext}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
            />

            <Text style={[styles.inputLabel, { color: theme.text }]}>Grupo Muscular</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
              placeholder="Ej. Hombros / Trapecio"
              placeholderTextColor={theme.subtext}
              value={newMuscle}
              onChangeText={setNewMuscle}
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Series</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
                  keyboardType="numeric"
                  value={newSets}
                  onChangeText={setNewSets}
                />
              </View>
              <View style={{ flex: 1, marginHorizontal: 4 }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Reps</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
                  value={newReps}
                  onChangeText={setNewReps}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Peso (Kg)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
                  keyboardType="numeric"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveModalButton, { backgroundColor: theme.tint }]}
              onPress={handleAddExercise}
            >
              <Text style={styles.saveModalButtonText}>Guardar Ejercicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBanner: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  badgeGroup: {
    alignItems: 'flex-end',
    gap: 6,
    backgroundColor: 'transparent',
  },
  flameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  flameText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  routineSelectorScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
  },
  routinePillText: {
    fontSize: 14,
  },
  routineMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#94A3B830',
  },
  exercisesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  exerciseCard: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfoContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  exerciseTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseMuscle: {
    fontSize: 12,
  },
  exerciseBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  exerciseVideoButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  exerciseVideoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseMetricBadge: {
    backgroundColor: 'transparent',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  weightControls: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  weightButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  weightBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightText: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  saveModalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveModalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
