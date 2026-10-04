import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Ionicons name="barbell" size={40} color={theme.tint} />
        <Text style={[styles.title, { color: theme.text }]}>Guía de Entrenamiento</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Principios clave para maximizar tus ganancias
        </Text>
      </View>

      <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Ionicons name="flash-outline" size={24} color={theme.tint} />
        <View style={styles.tipTextWrap}>
          <Text style={[styles.tipTitle, { color: theme.text }]}>Sobrecarga Progresiva</Text>
          <Text style={[styles.tipDesc, { color: theme.subtext }]}>
            Intenta aumentar una repetición más o añadir peso progresivamente cada semana para estimular el crecimiento muscular.
          </Text>
        </View>
      </View>

      <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Ionicons name="time-outline" size={24} color={theme.tint} />
        <View style={styles.tipTextWrap}>
          <Text style={[styles.tipTitle, { color: theme.text }]}>Descansos Óptimos</Text>
          <Text style={[styles.tipDesc, { color: theme.subtext }]}>
            Utiliza la pestaña &quot;Descanso&quot; para cronometrar entre 60 y 180 segundos. No apresures tus series pesadas.
          </Text>
        </View>
      </View>

      <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <Ionicons name="water-outline" size={24} color={theme.tint} />
        <View style={styles.tipTextWrap}>
          <Text style={[styles.tipTitle, { color: theme.text }]}>Nutrición e Hidratación</Text>
          <Text style={[styles.tipDesc, { color: theme.subtext }]}>
            Consume entre 1.6g y 2.2g de proteína por kilo de peso corporal y mantén una buena hidratación durante tu sesión.
          </Text>
        </View>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    gap: 14,
  },
  tipTextWrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
