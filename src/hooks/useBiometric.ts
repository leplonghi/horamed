import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Define types locally to avoid import issues in web builds
type BiometryType = 'fingerprintAuthentication' | 'faceAuthentication' | 'irisAuthentication' | 'none';

interface CheckBiometryResult {
  isAvailable: boolean;
  biometryType?: BiometryType;
}

interface AuthenticateOptions {
  reason: string;
  cancelTitle?: string;
  allowDeviceCredential?: boolean;
  iosFallbackTitle?: string;
  androidTitle?: string;
  androidSubtitle?: string;
  androidConfirmationRequired?: boolean;
}

// Lazy load biometric auth only on native platforms
let BiometricAuth: any = null;

const loadBiometricAuth = async () => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  
  try {
    const module = await import('@aparajita/capacitor-biometric-auth');
    return module.BiometricAuth;
  } catch (error) {
    console.error('Failed to load biometric auth:', error);
    return null;
  }
};

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const [isNativePlatform, setIsNativePlatform] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    // Check if running on native platform
    const isNative = Capacitor.isNativePlatform();
    setIsNativePlatform(isNative);

    if (!isNative) {
      setIsAvailable(false);
      return;
    }

    try {
      if (!BiometricAuth) {
        BiometricAuth = await loadBiometricAuth();
      }
      
      if (!BiometricAuth) {
        setIsAvailable(false);
        return;
      }

      const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType || 'none');
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const authenticate = async (reason: string = 'Autentique-se para continuar') => {
    if (!isAvailable || !isNativePlatform) {
      throw new Error('Biometria não disponível');
    }

    try {
      if (!BiometricAuth) {
        BiometricAuth = await loadBiometricAuth();
      }

      if (!BiometricAuth) {
        throw new Error('Biometria não disponível');
      }

      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Usar senha',
        androidTitle: 'Autenticação',
        androidSubtitle: 'Use sua biometria',
        androidConfirmationRequired: false,
      } as AuthenticateOptions);
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      throw error;
    }
  };

  const getBiometryName = () => {
    if (!biometryType || biometryType === 'none') return 'Biometria';
    
    switch (biometryType) {
      case 'fingerprintAuthentication':
        return 'Digital';
      case 'faceAuthentication':
        return 'Face ID';
      case 'irisAuthentication':
        return 'Íris';
      default:
        return 'Biometria';
    }
  };

  return {
    isAvailable,
    isNativePlatform,
    biometryType,
    authenticate,
    getBiometryName,
    checkBiometricAvailability,
  };
};
