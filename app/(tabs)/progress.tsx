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
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  PersonalRecord,
  WeightEntry,
  DEFAULT_PRS,
  DEFAULT_WEIGHT_LOG,
  subscribePRs,
  savePRs,
  subscribeWeightLog,
  saveWeightLog,
} from '@/services/gymStorage';
import { SyncBadge } from '@/components/SyncBadge';

const WEEK_DAYS = [
  { day: 'Lun', done: true },
  { day: 'Mar', done: true },
  { day: 'Mié', done: false },
  { day: 'Jue', done: true },
  { day: 'Vie', done: true },
  { day: 'Sáb', done: false },
  { day: 'Dom', done: false },
];

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [prs, setPrs] = useState<PersonalRecord[]>(DEFAULT_PRS);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>(DEFAULT_WEIGHT_LOG);

  // Modal para nuevo PR
  const [prModalVisible, setPrModalVisible] = useState(false);
  const [selectedPrId, setSelectedPrId] = useState<string | null>(null);
  const [newPrWeight, setNewPrWeight] = useState('');

  // Modal para nuevo Peso Corporal
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [inputWeight, setInputWeight] = useState('78.0');

  useEffect(() => {
    const unsubPRs = subscribePRs((data) => {
      if (data && data.length > 0) setPrs(data);
    });
    const unsubWeight = subscribeWeightLog((data) => {
      if (data && data.length > 0) setWeightLog(data);
    });

    return () => {
      unsubPRs();
      unsubWeight();
    };
  }, []);

  const currentWeight = weightLog[0]?.weightKg ?? 78.0;
  const initialWeight = 82.0;
  const targetWeight = 75.0;

  const handleUpdatePr = () => {
    const val = parseFloat(newPrWeight);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Ingresa un peso válido');
      return;
    }

    const updated = prs.map((item) =>
      item.id === selectedPrId
        ? { ...item, weightKg: val, date: 'Hoy' }
        : item
    );

    setPrs(updated);
    savePRs(updated);
    setPrModalVisible(false);
    setNewPrWeight('');
  };

  const handleAddWeight = () => {
    const val = parseFloat(inputWeight);
    if (isNaN(val) || val <= 30 || val >= 300) {
      Alert.alert('Error', 'Ingresa un peso corporal razonable');
      return;
    }

    const newEntry: WeightEntry = {
      id: Date.now().toString(),
      weightKg: val,
      date: 'Hoy',
    };

    const updated = [newEntry, ...weightLog];
    setWeightLog(updated);
    saveWeightLog(updated);
    setWeightModalVisible(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>MÉTRICAS Y LOGROS</Text>
            <Text style={[styles.title, { color: theme.text }]}>Tu Progreso Físico</Text>
          </View>
          <SyncBadge />
        </View>
      </View>

      {/* Tarjeta de Racha Semanal */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ backgroundColor: 'transparent' }}>
            <Text style={[styles.cardSectionTitle, { color: theme.text }]}>Entrenamientos Semanales</Text>
            <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>4 de 5 entrenamientos completados</Text>
          </View>
          <View style={[styles.trophyIcon, { backgroundColor: theme.tint + '20' }]}>
            <Ionicons name="flame" size={22} color={theme.tint} />
          </View>
        </View>

        <View style={styles.weekDaysRow}>
          {WEEK_DAYS.map((item, idx) => (
            <View key={idx} style={styles.dayCol}>
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: item.done ? theme.tint : theme.cardBorder,
                  },
                ]}
              >
                {item.done ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.pendingDot, { color: theme.subtext }]}>•</Text>
                )}
              </View>
              <Text
                style={[
                  styles.dayText,
                  { color: item.done ? theme.tint : theme.subtext, fontWeight: item.done ? '700' : '500' },
                ]}
              >
                {item.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Récords Personales (PRs) */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Récords Personales (PRs)</Text>
        <Ionicons name="trophy" size={20} color="#F59E0B" />
      </View>

      <View style={styles.prsGrid}>
        {prs.map((pr) => (
          <TouchableOpacity
            key={pr.id}
            style={[styles.prCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            activeOpacity={0.8}
            onPress={() => {
              setSelectedPrId(pr.id);
              setNewPrWeight(pr.weightKg.toString());
              setPrModalVisible(true);
            }}
          >
            <View style={styles.prHeader}>
              <View style={[styles.prIconBox, { backgroundColor: theme.tint + '15' }]}>
                <Ionicons
                  name={(pr.icon as keyof typeof Ionicons.glyphMap) || 'barbell'}
                  size={20}
                  color={theme.tint}
                />
              </View>
              <Text style={[styles.prDate, { color: theme.subtext }]}>{pr.date}</Text>
            </View>
            <Text style={[styles.prWeight, { color: theme.text }]}>{pr.weightKg} kg</Text>
            <Text style={[styles.prLiftName, { color: theme.subtext }]}>{pr.lift}</Text>
            <View style={styles.tapToEditRow}>
              <Ionicons name="create-outline" size={12} color={theme.tint} />
              <Text style={[styles.tapToEditText, { color: theme.tint }]}>Toca para actualizar</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Control de Peso Corporal */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Evolución de Peso Corporal</Text>
        <TouchableOpacity
          style={[styles.addWeightBtn, { backgroundColor: theme.tint }]}
          onPress={() => setWeightModalVisible(true)}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addWeightBtnText}>Registrar</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.weightSummaryRow}>
          <View style={styles.weightStat}>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Inicial</Text>
            <Text style={[styles.statVal, { color: theme.text }]}>{initialWeight} kg</Text>
          </View>
          <View style={styles.weightDivider} />
          <View style={styles.weightStat}>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Actual</Text>
            <Text style={[styles.statVal, { color: theme.tint }]}>{currentWeight} kg</Text>
          </View>
          <View style={styles.weightDivider} />
          <View style={styles.weightStat}>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Meta</Text>
            <Text style={[styles.statVal, { color: theme.text }]}>{targetWeight} kg</Text>
          </View>
        </View>

        {/* Historial reciente */}
        <Text style={[styles.historyTitle, { color: theme.subtext }]}>Últimas mediciones:</Text>
        {weightLog.slice(0, 4).map((entry) => (
          <View key={entry.id} style={[styles.historyRow, { borderBottomColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
              <Ionicons name="scale-outline" size={16} color={theme.tint} style={{ marginRight: 8 }} />
              <Text style={[styles.historyDate, { color: theme.text }]}>{entry.date}</Text>
            </View>
            <Text style={[styles.historyWeight, { color: theme.text }]}>{entry.weightKg} kg</Text>
          </View>
        ))}
      </View>

      {/* Modal para actualizar PR */}
      <Modal visible={prModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalHeading, { color: theme.text }]}>Actualizar Récord (PR)</Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>
              {prs.find((p) => p.id === selectedPrId)?.lift}
            </Text>

            <TextInput
              style={[styles.largeInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
              keyboardType="numeric"
              value={newPrWeight}
              onChangeText={setNewPrWeight}
              placeholder="Ej. 100"
              placeholderTextColor={theme.subtext}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setPrModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.tint }]}
                onPress={handleUpdatePr}
              >
                <Text style={styles.confirmBtnText}>Guardar Récord</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para registrar Peso */}
      <Modal visible={weightModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalHeading, { color: theme.text }]}>Registrar Peso Corporal</Text>
            <Text style={[styles.modalDesc, { color: theme.subtext }]}>Ingresa tu peso de hoy en kilogramos</Text>

            <TextInput
              style={[styles.largeInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.background }]}
              keyboardType="numeric"
              value={inputWeight}
              onChangeText={setInputWeight}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.cardBorder }]}
                onPress={() => setWeightModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.tint }]}
                onPress={handleAddWeight}
              >
                <Text style={styles.confirmBtnText}>Añadir Peso</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  dayCol: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  pendingDot: {
    fontSize: 18,
  },
  dayText: {
    fontSize: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  prsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  prCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  prIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  prWeight: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  prLiftName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  tapToEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  tapToEditText: {
    fontSize: 10,
    fontWeight: '700',
  },
  addWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  addWeightBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  weightSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  weightStat: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  weightDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#94A3B830',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  historyDate: {
    fontSize: 13,
  },
  historyWeight: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    marginBottom: 16,
  },
  largeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
