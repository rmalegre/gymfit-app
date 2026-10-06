import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { auth } from '@/services/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  Routine,
  Exercise,
  DEFAULT_ROUTINES,
  getRecentVideos,
  saveRecentVideo,
  subscribeRoutines,
  saveRoutines,
  WatchedVideo,
} from '@/services/gymStorage';
import { SyncBadge } from '@/components/SyncBadge';
import { WeeklyPlan, loadWeeklyPlan } from '@/services/weeklyPlan';

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [routines, setRoutines] = useState<Routine[]>(DEFAULT_ROUTINES);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('chest_triceps');
  const [videoExerciseName, setVideoExerciseName] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [recentVideos, setRecentVideos] = useState<WatchedVideo[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getRecentVideos()
        .then((videos) => {
          if (isMounted) setRecentVideos(videos);
        })
        .catch((error) => console.warn('[Videos] No se pudo cargar el historial:', error));

      return () => {
        isMounted = false;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadWeeklyPlan()
        .then((plan) => {
          if (isMounted) setWeeklyPlan(plan);
        })
        .catch((error) => console.warn('[Rutina semanal] No se pudo cargar:', error));
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const updateRoutinesAndPersist = (updater: (prev: Routine[]) => Routine[]) => {
    if (!auth?.currentUser) {
      Alert.alert(
        'Inicia sesión para personalizar',
        'Puedes ver las rutinas sin una cuenta. Para guardar cambios en tu rutina, inicia sesión o crea una cuenta.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/sign-in') },
        ]
      );
      return;
    }
    setRoutines((prev) => {
      const next = updater(prev);
      saveRoutines(next).catch((error) => {
        console.error('[Rutinas] No se pudieron guardar los cambios:', error);
        Alert.alert('No se pudo guardar', 'Inténtalo de nuevo.');
      });
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

    if (Platform.OS !== 'web') {
      setVideoId(null);
      setVideoExerciseName(exerciseName);
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('[Videos] No se pudo abrir YouTube:', error);
      Alert.alert('No se pudo abrir YouTube', 'Comprueba tu conexión e inténtalo de nuevo.');
    }
  };

  const openRecentVideo = (video: WatchedVideo) => {
    setVideoId(video.videoId);
    setVideoExerciseName(video.exerciseName);
  };

  const trackWatchedVideo = (url: string) => {
    if (!videoExerciseName) return;

    const matchedId = url.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1]
      ?? url.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/)?.[1];
    if (!matchedId || recentVideos[0]?.videoId === matchedId) return;

    const watchedVideo: WatchedVideo = {
      videoId: matchedId,
      exerciseName: videoExerciseName,
      watchedAt: new Date().toISOString(),
    };
    saveRecentVideo(watchedVideo)
      .then(setRecentVideos)
      .catch((error) => console.warn('[Videos] No se pudo guardar el historial:', error));
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
      <ImageBackground
        source={require('../../assets/images/gym-banner-reference.jpg')}
        resizeMode="cover"
        imageStyle={styles.headerBannerImage}
        style={[styles.headerBanner, { borderColor: theme.cardBorder }]}
      >
        <View pointerEvents="none" style={styles.headerBannerScrim} />
        <View style={styles.bannerRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[styles.greeting, { color: theme.tint }]}>MÁS FUERTE QUE AYER</Text>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Entrena hoy</Text>
          </View>
          <View style={styles.badgeGroup}>
            <SyncBadge />
            <View style={[styles.flameBadge, { backgroundColor: theme.tint + '20' }]}>
              <Ionicons name="flame" size={16} color={theme.tint} />
              <Text style={[styles.flameText, { color: theme.tint }]}>5d</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push('/(tabs)/weekly')}
          accessibilityRole="button"
          accessibilityLabel={weeklyPlan ? 'Ver mi rutina semanal' : 'Armar mi rutina semanal'}
        >
          <Text style={styles.startButtonText}>{weeklyPlan ? 'Ver mi rutina' : 'Armar mi semana'}</Text>
          <Ionicons name="arrow-forward" size={17} color="#061006" />
        </TouchableOpacity>

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
      </ImageBackground>

      {weeklyPlan && weeklyPlan.days.length > 0 && (
        <View style={styles.myWeekSection}>
          <View style={styles.weekSectionHeading}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Mi semana</Text>
              <Text style={[styles.weekSectionSubtitle, { color: theme.subtext }]}>
                {weeklyPlan.level} · {weeklyPlan.goal} · {weeklyPlan.days.length} días
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/weekly')}
              style={[styles.editWeekButton, { borderColor: theme.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Ver y editar mi rutina semanal"
            >
              <Text style={[styles.editWeekText, { color: theme.tint }]}>Ver semana</Text>
              <Ionicons name="chevron-forward" size={15} color={theme.tint} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekCardsRow}>
            {weeklyPlan.days.map((day) => {
              const dayCompleted = day.exercises.filter((exercise) => exercise.completed).length;
              return (
                <TouchableOpacity
                  key={`${day.day}-${day.focus}`}
                  style={[styles.weekPlanCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => router.push('/(tabs)/weekly')}
                  activeOpacity={0.8}
                >
                  <View style={styles.weekPlanCardTop}>
                    <View style={[styles.weekDayBadge, { backgroundColor: `${theme.tint}20` }]}>
                      <Text style={[styles.weekDayBadgeText, { color: theme.tint }]}>{day.day}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={theme.subtext} />
                  </View>
                  <Text style={[styles.weekPlanFocus, { color: theme.text }]} numberOfLines={1}>{day.focus}</Text>
                  <Text style={[styles.weekPlanMeta, { color: theme.subtext }]}>
                    {day.exercises.length} ejercicios · {dayCompleted}/{day.exercises.length} listos
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Selector de Rutinas */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Otras rutinas</Text>
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
                color={isSelected ? '#061006' : theme.subtext}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.routinePillText,
                  { color: isSelected ? '#061006' : theme.text, fontWeight: isSelected ? '700' : '500' },
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

      <View style={styles.recentVideosSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Últimos videos vistos</Text>
          {recentVideos.length > 0 && (
            <Ionicons name="time-outline" size={18} color={theme.subtext} />
          )}
        </View>
        {recentVideos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentVideosList}
          >
            {recentVideos.map((video) => (
              <TouchableOpacity
                key={video.videoId}
                style={[styles.recentVideoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                onPress={() => openRecentVideo(video)}
                accessibilityRole="button"
                accessibilityLabel={`Volver a ver técnica de ${video.exerciseName}`}
                activeOpacity={0.8}
              >
                <View style={styles.recentVideoThumbnail}>
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` }}
                    style={styles.recentVideoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.recentVideoPlay}>
                    <Ionicons name="play" size={20} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={[styles.recentVideoTitle, { color: theme.text }]} numberOfLines={2}>
                  {video.exerciseName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.recentVideosEmpty, { color: theme.subtext }]}>
            Los videos que reproduzcas aparecerán aquí.
          </Text>
        )}
      </View>

      {/* Lista de Ejercicios */}
      <View style={styles.exercisesHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ejercicios de la Rutina</Text>
        <TouchableOpacity
          style={[styles.addExerciseButton, { backgroundColor: theme.tint }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#061006" />
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
              accessibilityLabel={`Ver video de técnica para ${exercise.name}`}
            >
              <Ionicons name="play-circle-outline" size={20} color={theme.tint} />
              <Text style={[styles.exerciseVideoText, { color: theme.tint }]}>Ver video de técnica</Text>
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

      <Modal
        visible={videoExerciseName !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setVideoExerciseName(null);
          setVideoId(null);
        }}
      >
        <SafeAreaView style={[styles.videoModal, { backgroundColor: theme.background }]}>
          <View style={[styles.videoModalHeader, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.videoModalTitle, { color: theme.text }]} numberOfLines={1}>
              Técnica: {videoExerciseName}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setVideoExerciseName(null);
                setVideoId(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Cerrar video"
              hitSlop={10}
            >
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>
          {videoExerciseName !== null && (
            <WebView
              style={styles.videoWebView}
              source={{
                uri: videoId
                  ? `https://www.youtube.com/watch?v=${videoId}`
                  : `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      `${videoExerciseName} técnica correcta tutorial corto shorts`
                    )}`,
              }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onNavigationStateChange={({ url }) => trackWatchedVideo(url)}
              onError={({ nativeEvent }) => {
                console.warn('[Videos] No se pudo cargar el video:', nativeEvent.description);
                Alert.alert('No se pudo cargar el video', 'Comprueba tu conexión e inténtalo de nuevo.');
              }}
            />
          )}
        </SafeAreaView>
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
    minHeight: 270,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    backgroundColor: '#050806',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  headerBannerImage: {
    borderRadius: 20,
    opacity: 0.68,
  },
  headerBannerScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 5, 2, 0.48)',
  },
  myWeekSection: {
    marginBottom: 22,
    backgroundColor: 'transparent',
  },
  weekSectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  weekSectionSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  editWeekButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    borderRadius: 17,
    borderWidth: 1,
    gap: 2,
  },
  editWeekText: {
    fontSize: 11,
    fontWeight: '800',
  },
  weekCardsRow: {
    paddingRight: 4,
  },
  weekPlanCard: {
    width: 190,
    padding: 13,
    borderWidth: 1,
    borderRadius: 15,
    marginRight: 10,
  },
  weekPlanCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  weekDayBadge: {
    minWidth: 38,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  weekDayBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  weekPlanFocus: {
    fontSize: 14,
    fontWeight: '800',
  },
  weekPlanMeta: {
    fontSize: 10,
    marginTop: 5,
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
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  startButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
    gap: 8,
    marginTop: 20,
  },
  startButtonText: {
    color: '#061006',
    fontSize: 12,
    fontWeight: '900',
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
    color: '#061006',
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
  recentVideosSection: {
    marginBottom: 22,
  },
  recentVideosList: {
    paddingRight: 4,
  },
  recentVideoCard: {
    width: 248,
    marginRight: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentVideoThumbnail: {
    aspectRatio: 16 / 9,
    backgroundColor: '#101827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentVideoImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  recentVideoPlay: {
    width: 46,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#FF0033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentVideoTitle: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 54,
  },
  recentVideosEmpty: {
    fontSize: 13,
    paddingVertical: 8,
  },
  videoModal: {
    flex: 1,
  },
  videoModalHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  videoModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 16,
  },
  videoWebView: {
    flex: 1,
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
    color: '#061006',
    fontSize: 15,
    fontWeight: '700',
  },
});
