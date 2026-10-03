/**
 * Configuración de Firebase para GymFit.
 * 
 * Puedes configurar estas variables en un archivo .env (usando EXPO_PUBLIC_*)
 * o rellenar directamente las claves aquí abajo desde tu consola de Firebase:
 * https://console.firebase.google.com/
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSy_TU_API_KEY_AQUI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "tu-proyecto.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "tu-proyecto-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "tu-proyecto.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
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
