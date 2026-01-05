import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.horamed.app',
  appName: 'HoraMed',
  webDir: 'dist',
  server: {
    // Hot-reload from sandbox for development
    url: 'https://281a4314-4cea-4c93-9b25-b97f8d39e706.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#10B981',
      sound: 'notification.wav',
      // Default channel - will be overridden by app code
      channelId: 'horamed_alarm',
      channelName: 'Alarmes de Medicamentos',
      channelDescription: 'Alarmes importantes para lembrar de tomar medicamentos',
      channelImportance: 5, // IMPORTANCE_HIGH - shows heads-up notification
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10B981',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Enable for debugging
    backgroundColor: '#10B981',
    // Build options
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
