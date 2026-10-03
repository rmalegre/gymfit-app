# GymFit

Aplicación móvil de entrenamiento para organizar rutinas de gimnasio, seguir el progreso y cronometrar los descansos entre series. Está construida con Expo y React Native, y puede ejecutarse en Android, iOS y web.

## Funciones

- Rutinas de entrenamiento con ejercicios, series, repeticiones y peso.
- Seguimiento de ejercicios completados y ajuste de cargas.
- Registro de récords personales y evolución del peso corporal.
- Temporizador de descanso con tiempos predefinidos, controles para iniciar, pausar y reiniciar, y alertas hápticas en dispositivos compatibles.
- Preferencias de entrenamiento y selección de objetivo.

> La aplicación utiliza datos de ejemplo y estado local en memoria. Los cambios no se conservan al cerrar la aplicación.

## Requisitos

- Node.js y npm.
- Para probar en un dispositivo físico, instala Expo Go o prepara un entorno de desarrollo nativo.

## Instalación

```bash
git clone https://github.com/rmalegre/gymfit-app.git
cd gymfit-app
npm ci
```

## Desarrollo

Inicia el servidor de Expo:

```bash
npm start
```

También puedes iniciar directamente para una plataforma:

```bash
npm run android
npm run ios
npm run web
```

## Tecnologías

- Expo SDK 57
- React Native 0.86
- React 19
- Expo Router
- TypeScript