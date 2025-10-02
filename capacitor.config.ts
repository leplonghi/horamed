import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.281a43144cea4c939b25b97f8d39e706',
  appName: 'horamed',
  webDir: 'dist',
  server: {
    url: 'https://281a4314-4cea-4c93-9b25-b97f8d39e706.lovableproject.com?forceHideBadge=true',
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
