import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.281a43144cea4c939b25b97f8d39e706',
  appName: 'horamed',
  webDir: 'dist',
  server: {
    url: 'https://horamed.lovable.app?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BiometricAuth: {
      androidTitle: 'Autenticação Biométrica',
      androidSubtitle: 'Use sua digital ou Face ID',
      androidConfirmationRequired: false,
      androidBiometryStrength: 1,
    }
  }
};

export default config;
