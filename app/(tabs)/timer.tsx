import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Platform,
  Vibration,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const PRESETS = [30, 45, 60, 90, 120, 180];

export default function TimerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [totalSeconds, setTotalSeconds] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [finishedAlert, setFinishedAlert] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setFinishedAlert(true);
            if (Platform.OS !== 'web') {
              Vibration.vibrate([0, 500, 200, 500]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const selectPreset = (seconds: number) => {
    setIsActive(false);
    setFinishedAlert(false);
    setTotalSeconds(seconds);
    setTimeLeft(seconds);
  };

  const toggleStartPause = () => {
    if (timeLeft === 0) {
      setTimeLeft(totalSeconds);
      setFinishedAlert(false);
      setIsActive(true);
      return;
    }
    setFinishedAlert(false);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setFinishedAlert(false);
    setTimeLeft(totalSeconds);
  };

  const adjustTime = (delta: number) => {
    setTimeLeft((prev) => {
      const nextVal = Math.max(5, prev + delta);
      setTotalSeconds((tot) => Math.max(nextVal, tot));
      return nextVal;
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>CRONÓMETRO DE DESCANSO</Text>
        <Text style={[styles.title, { color: theme.text }]}>Temporizador de Series</Text>
      </View>

      {/* Tarjeta del temporizador principal */}
      <View style={[styles.timerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {/* Anillo de progreso / Display central */}
        <View style={[styles.displayCircle, { borderColor: isActive ? theme.tint : theme.cardBorder }]}>
          <Text style={[styles.digitalTime, { color: finishedAlert ? theme.accent : theme.text }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={[styles.targetLabel, { color: theme.subtext }]}>
            {isActive ? 'Descansando...' : finishedAlert ? '¡Tiempo cumplido! 🔥' : 'Listo'}
          </Text>
        </View>

        {/* Barra de progreso */}
        <View style={[styles.progressTrack, { backgroundColor: theme.cardBorder }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: finishedAlert ? theme.accent : theme.tint,
              },
            ]}
          />
        </View>

        {/* Ajustes rápidos (+15s / -15s) */}
        <View style={styles.adjustRow}>
          <TouchableOpacity
            style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}
            onPress={() => adjustTime(-15)}
          >
            <Text style={[styles.adjustText, { color: theme.subtext }]}>-15s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adjustBtn, { borderColor: theme.cardBorder }]}
            onPress={() => adjustTime(15)}
          >
            <Text style={[styles.adjustText, { color: theme.subtext }]}>+15s</Text>
          </TouchableOpacity>
        </View>

        {/* Botones de acción principales */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}
            onPress={resetTimer}
          >
            <Ionicons name="refresh" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: isActive ? '#EF4444' : theme.tint },
            ]}
            onPress={toggleStartPause}
          >
            <Ionicons
              name={isActive ? 'pause' : 'play'}
              size={28}
              color="#FFFFFF"
              style={{ marginLeft: isActive ? 0 : 4 }}
            />
            <Text style={styles.primaryButtonText}>{isActive ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector de Presets */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Tiempos Recomendados</Text>
      <View style={styles.presetsGrid}>
        {PRESETS.map((seconds) => {
          const isSelected = totalSeconds === seconds;
          return (
            <TouchableOpacity
              key={seconds}
              style={[
                styles.presetCard,
                {
                  backgroundColor: isSelected ? theme.tint : theme.card,
                  borderColor: isSelected ? theme.tint : theme.cardBorder,
                },
              ]}
              onPress={() => selectPreset(seconds)}
            >
              <Text
                style={[
                  styles.presetSec,
                  { color: isSelected ? '#FFFFFF' : theme.text },
                ]}
              >
                {seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`}
              </Text>
              <Text
                style={[
                  styles.presetDesc,
                  { color: isSelected ? '#F0FDF4' : theme.subtext },
                ]}
              >
                {seconds <= 45 ? 'Hipertrofia corta' : seconds <= 90 ? 'Estándar' : 'Fuerza pesada'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tip de entrenamiento */}
      <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Ionicons name="information-circle" size={22} color={theme.tint} />
        <View style={{ flex: 1, backgroundColor: 'transparent', marginLeft: 10 }}>
          <Text style={[styles.tipTitle, { color: theme.text }]}>Consejo de Hipertrofia</Text>
          <Text style={[styles.tipText, { color: theme.subtext }]}>
            Para ejercicios compuestos pesados (Sentadilla, Press banca) descansa entre 2 a 3 minutos. Para aislamiento bastan 60-90 segundos.
          </Text>
        </View>
      </View>
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
  header: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  timerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  displayCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  digitalTime: {
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  adjustBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  adjustText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'transparent',
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    height: 54,
    borderRadius: 27,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  presetCard: {
    width: '31%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetSec: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
