import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import {
  UserProfile,
  DEFAULT_PROFILE,
  subscribeProfile,
  saveProfile,
  isCloudSyncActive,
} from '@/services/gymStorage';
import { SyncBadge } from '@/components/SyncBadge';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const isCloud = isCloudSyncActive();

  useEffect(() => {
    const unsub = subscribeProfile((data) => {
      if (data) setProfile(data);
    });
    return () => unsub();
  }, []);

  const updateProfileAndPersist = (patch: Partial<UserProfile>) => {
    const updated = { ...profile, ...patch };
    setProfile(updated);
    saveProfile(updated);
  };

  const showFirebaseHelp = () => {
    Alert.alert(
      'Configuración de Firebase',
      'Para conectar tu propia base de datos Cloud Firestore:\n\n1. Ve a console.firebase.google.com y crea un proyecto.\n2. Crea una base de datos Cloud Firestore en modo producción o prueba.\n3. Añade una Web App y copia tus credenciales.\n4. Pégalas en "services/firebaseConfig.ts" o en tu archivo .env con el prefijo EXPO_PUBLIC_.'
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Perfil */}
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatarBox, { backgroundColor: theme.tint + '20' }]}>
            <Ionicons name="barbell" size={36} color={theme.tint} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'transparent', marginLeft: 14 }}>
            <View style={styles.userTitleRow}>
              <Text style={[styles.userName, { color: theme.text }]}>{profile.name}</Text>
              <SyncBadge />
            </View>
            <Text style={[styles.userHandle, { color: theme.subtext }]}>Plan de Entrenamiento Personal</Text>
            <View style={[styles.levelTag, { backgroundColor: theme.tint + '20' }]}>
              <Ionicons name="medal-outline" size={14} color={theme.tint} />
              <Text style={[styles.levelText, { color: theme.tint }]}>{profile.level}</Text>
            </View>
          </View>
        </View>

        {/* Resumen de estadísticas globales */}
        <View style={[styles.statsRow, { borderTopColor: theme.cardBorder }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{profile.sessions}</Text>
            <Text style={[styles.statCaption, { color: theme.subtext }]}>Sesiones</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: theme.tint }]}>{profile.volumeTon} t</Text>
            <Text style={[styles.statCaption, { color: theme.subtext }]}>Volumen</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{profile.streakDays} días</Text>
            <Text style={[styles.statCaption, { color: theme.subtext }]}>Racha</Text>
          </View>
        </View>
      </View>

      {/* Objetivo Principal */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Objetivo Principal</Text>
      <View style={styles.goalsRow}>
        {(['Hipertrofia', 'Fuerza', 'Definición'] as const).map((goal) => {
          const isSelected = profile.goal === goal;
          return (
            <TouchableOpacity
              key={goal}
              style={[
                styles.goalPill,
                {
                  backgroundColor: isSelected ? theme.tint : theme.card,
                  borderColor: isSelected ? theme.tint : theme.cardBorder,
                },
              ]}
              onPress={() => updateProfileAndPersist({ goal })}
            >
              <Text
                style={[
                  styles.goalText,
                  { color: isSelected ? '#FFFFFF' : theme.text, fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Configuración y Preferencias */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferencias de la App</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high-outline" size={20} color={theme.tint} style={{ marginRight: 12 }} />
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Sonido de Temporizador</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>Alerta sonora al terminar el descanso</Text>
            </View>
          </View>
          <Switch
            value={profile.soundEnabled}
            onValueChange={(val) => updateProfileAndPersist({ soundEnabled: val })}
            trackColor={{ false: theme.cardBorder, true: theme.tint }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait-outline" size={20} color={theme.tint} style={{ marginRight: 12 }} />
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Vibración Háptica</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>Vibrar al marcar series y tiempos</Text>
            </View>
          </View>
          <Switch
            value={profile.vibrationEnabled}
            onValueChange={(val) => updateProfileAndPersist({ vibrationEnabled: val })}
            trackColor={{ false: theme.cardBorder, true: theme.tint }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingDivider, { backgroundColor: theme.cardBorder }]} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="speedometer-outline" size={20} color={theme.tint} style={{ marginRight: 12 }} />
            <View style={{ backgroundColor: 'transparent' }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Unidad de Peso ({profile.useKg ? 'KG' : 'LBS'})</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>Kilogramos o Libras</Text>
            </View>
          </View>
          <Switch
            value={profile.useKg}
            onValueChange={(val) => updateProfileAndPersist({ useKg: val })}
            trackColor={{ false: theme.cardBorder, true: theme.tint }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Tarjeta de Estado Cloud Firestore */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Base de Datos Cloud</Text>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
        activeOpacity={0.8}
        onPress={showFirebaseHelp}
      >
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons
              name={isCloud ? 'cloud-done' : 'cloud-offline-outline'}
              size={24}
              color={isCloud ? theme.tint : theme.accent}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                {isCloud ? 'Firestore Sincronizado' : 'Modo Offline / Local'}
              </Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>
                {isCloud
                  ? 'Tus datos se respaldan en la nube en tiempo real'
                  : 'Toca aquí para ver cómo vincular tus credenciales de Firestore'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
        </View>
      </TouchableOpacity>

      {/* Frase motivacional */}
      <View style={[styles.quoteCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Ionicons name="flame" size={24} color={theme.accent} />
        <Text style={[styles.quoteText, { color: theme.text }]}>
          &quot;La disciplina es el puente entre tus metas y tus logros. ¡Sigue constante cada día!&quot;
        </Text>
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
  profileCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  userHandle: {
    fontSize: 12,
    marginBottom: 6,
  },
  levelTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  statCol: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statCaption: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#94A3B830',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  goalPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  goalText: {
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
  },
  settingDivider: {
    height: 1,
    marginVertical: 10,
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});
