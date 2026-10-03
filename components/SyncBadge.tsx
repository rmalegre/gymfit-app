import React from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { isCloudSyncActive } from '@/services/gymStorage';

export function SyncBadge() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isCloud = isCloudSyncActive();

  const handlePress = () => {
    if (isCloud) {
      Alert.alert(
        'Sincronización en la Nube',
        'Tu aplicación está conectada con Google Cloud Firestore en tiempo real. Todas tus rutinas y récords se guardan en la nube.'
      );
    } else {
      Alert.alert(
        'Modo Local Activo',
        'Tus datos se están guardando localmente en tu dispositivo. Para sincronizar con Firestore en la nube, edita tus claves en "services/firebaseConfig.ts" o agrega tus variables en un archivo .env'
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
