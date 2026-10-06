import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { auth } from '@/services/firebase';

export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setErrorMessage('');
    const normalizedEmail = email.trim();
    if (!auth) {
      setErrorMessage('Firebase Auth no está disponible. Revisa la configuración de Firebase.');
      return;
    }
    if (!normalizedEmail || !password) {
      setErrorMessage('Escribe tu correo y contraseña.');
      return;
    }
    if (isCreatingAccount && password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreatingAccount) {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      }
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof FirebaseError) {
        const messages: Record<string, string> = {
          'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
          'auth/invalid-email': 'El formato del correo no es válido.',
          'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
          'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
          'auth/operation-not-allowed': 'Activa el proveedor Correo/Contraseña en Firebase Authentication.',
          'auth/network-request-failed': 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.',
        };
        setErrorMessage(messages[error.code] ?? 'No se pudo completar el inicio de sesión.');
        if (!messages[error.code]) console.error('[Firebase Auth] Error de autenticación:', error);
      } else {
        console.error('[Firebase Auth] Error inesperado:', error);
        setErrorMessage('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={[styles.brandIcon, { backgroundColor: theme.tint + '20' }]}>
            <Text style={[styles.brandLetter, { color: theme.tint }]}>G</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>GYMFIT</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            {isCreatingAccount ? 'Crea tu cuenta para guardar tu progreso' : 'Inicia sesión para ver tu entrenamiento'}
          </Text>

          <View style={styles.form}>
            <TextInput
              accessibilityLabel="Correo electrónico"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Correo electrónico"
              placeholderTextColor={theme.subtext}
              style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.card }]}
              value={email}
            />
            <TextInput
              accessibilityLabel="Contraseña"
              autoCapitalize="none"
              autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
              onChangeText={setPassword}
              onSubmitEditing={submit}
              placeholder="Contraseña"
              placeholderTextColor={theme.subtext}
              secureTextEntry
              style={[styles.input, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.card }]}
              value={password}
            />

            {errorMessage ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: theme.accent }]}>
                {errorMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={submit}
              style={[styles.submitButton, { backgroundColor: theme.tint, opacity: isSubmitting ? 0.7 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#061006" />
              ) : (
                <Text style={styles.submitText}>
                  {isCreatingAccount ? 'Crear cuenta' : 'Iniciar sesión'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => {
                setErrorMessage('');
                setIsCreatingAccount((value) => !value);
              }}
              style={styles.modeButton}
            >
              <Text style={[styles.modeText, { color: theme.tint }]}>
                {isCreatingAccount ? 'Ya tengo una cuenta' : 'Crear una cuenta'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.privacyNote, { color: theme.subtext }]}>
            Tus datos de entrenamiento se guardan separados por cuenta.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandLetter: {
    fontSize: 34,
    fontWeight: '900',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  form: {
    width: '100%',
    gap: 14,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#061006',
    fontSize: 15,
    fontWeight: '800',
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  privacyNote: {
    marginTop: 28,
    fontSize: 12,
    textAlign: 'center',
  },
});
