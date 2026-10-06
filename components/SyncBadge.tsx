import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { Text } from './Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { isCloudSyncActive } from '@/services/gymStorage';
import { auth } from '@/services/firebase';

export function SyncBadge() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [isCloud, setIsCloud] = useState(isCloudSyncActive());

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, () => setIsCloud(isCloudSyncActive()));
  }, []);

  const handlePress = () => {
    if (isCloud) {
      Alert.alert(
        'Sincronización en la Nube',
        'Tu aplicación está conectada con Google Cloud Firestore en tiempo real. Todas tus rutinas y récords se guardan en la nube.'
      );
    } else {
      Alert.alert(
        'Modo Local Activo',
        'La app está en modo de consulta pública. Inicia sesión para guardar tus rutinas y progreso de forma privada en Firestore.'
      );
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        {
          backgroundColor: isCloud ? theme.tint + '15' : theme.accent + '15',
          borderColor: isCloud ? theme.tint : theme.accent,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isCloud ? 'cloud-done-outline' : 'save-outline'}
        size={14}
        color={isCloud ? theme.tint : theme.accent}
      />
      <Text
        style={[
          styles.badgeText,
          { color: isCloud ? theme.tint : theme.accent },
        ]}
      >
        {isCloud ? 'Firestore Activo' : 'Guardado Local'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
