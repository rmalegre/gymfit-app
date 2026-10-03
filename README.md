# GymFit

GymFit es un prototipo de aplicación móvil para acompañar los entrenamientos de gimnasio. Incluye pantallas para consultar rutinas, cronometrar descansos y visualizar métricas y preferencias. Está desarrollado con Expo, React Native y TypeScript, con soporte para Android, iOS y web.

> **Estado del proyecto:** prototipo funcional con datos de ejemplo. La información se mantiene en memoria mientras la aplicación está abierta; no hay backend ni almacenamiento persistente, por lo que los cambios se reinician al cerrar o recargar la app.

## Funcionalidades actuales

- **Rutinas:** consulta rutinas de ejemplo, marca ejercicios como completados, ajusta el peso y agrega ejercicios a la rutina seleccionada.
- **Temporizador:** inicia, pausa y reinicia descansos; elige tiempos predefinidos o ajústalos en intervalos de 15 segundos. En dispositivos nativos, vibra al finalizar.
- **Progreso:** muestra métricas y récords de ejemplo; permite actualizar pesos y registrar el peso corporal durante la sesión.
- **Perfil:** permite seleccionar un objetivo y modificar preferencias de sonido, vibración y unidades. Estos controles son demostrativos y no se guardan ni afectan todavía el resto de la aplicación.
- **Tema:** adapta la interfaz a los modos claro y oscuro del dispositivo.

## Tecnologías

- Expo SDK 57
- React Native 0.86
- React 19
- TypeScript
- Expo Router

## Requisitos

- Node.js y npm.
- Git para clonar el repositorio.

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/rmalegre/gymfit-app.git
cd gymfit-app
npm ci
```

## Ejecutar la aplicación

Inicia el servidor de desarrollo:

```bash
npm start
```

También puedes iniciar el proyecto directamente en una plataforma:

```bash
npm run android
npm run ios
npm run web
```

## Estructura del proyecto

```text
app/
  (tabs)/       Pantallas de rutinas, descanso, progreso y perfil
  _layout.tsx   Navegación y configuración del tema
  modal.tsx     Guía de entrenamiento
components/     Componentes reutilizables y controles de tema
constants/      Colores de la aplicación
assets/         Fuentes e imágenes
```

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia Expo en modo desarrollo. |
| `npm run android` | Inicia Expo para Android. |
| `npm run ios` | Inicia Expo para iOS. |
| `npm run web` | Inicia Expo para web. |
