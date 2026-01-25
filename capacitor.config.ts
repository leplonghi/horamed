import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration - HoraMed
 * 
 * PRODUCTION BUILD NOTES:
 * - server.url is commented out for production builds
 * - For development/testing, uncomment to enable hot-reload
 * - webContentsDebuggingEnabled must be FALSE for Play Store release
 */
const config: CapacitorConfig = {
  appId: 'dev.horamed.app',
  appName: 'HoraMed',
  webDir: 'dist',
  // Development server - COMMENT OUT FOR PRODUCTION BUILDS
  // server: {
  //   url: 'https://281a4314-4cea-4c93-9b25-b97f8d39e706.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0ea5e9',
      sound: 'notification.wav',
      channelId: 'horamed_alarm',
      channelName: 'Alarmes de Medicamentos',
      channelDescription: 'Alarmes importantes para lembrar de tomar medicamentos',
      channelImportance: 5,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0ea5e9',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // MUST be false for Play Store release
    backgroundColor: '#0ea5e9',
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
