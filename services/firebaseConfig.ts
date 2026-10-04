/**
 * Configuración de Firebase para GymFit.
 * Credenciales conectadas al proyecto: gym-fit-70a48
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBlwxqNqWxAf2O1uiABCCxO-dAYgYcyQtE",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "gym-fit-70a48.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "gym-fit-70a48",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "gym-fit-70a48.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "362341773236",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:362341773236:web:f7b5a25f35a62c1bc44ce1",
};

// Comprueba si el usuario ya ingresó sus credenciales reales de Firebase
export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('TU_API_KEY') &&
    Boolean(firebaseConfig.projectId) &&
    !firebaseConfig.projectId.includes('tu-proyecto')
  );
};
