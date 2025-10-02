import { useState, useEffect } from 'react';
import { BiometricAuth, BiometryType, CheckBiometryResult } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType | undefined>();
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
      const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType);
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
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Usar senha',
        androidTitle: 'Autenticação',
        androidSubtitle: 'Use sua biometria',
        androidConfirmationRequired: false,
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      throw error;
    }
  };

  const getBiometryName = () => {
    if (!biometryType) return 'Biometria';
    
    switch (biometryType) {
      case BiometryType.fingerprintAuthentication:
        return 'Digital';
      case BiometryType.faceAuthentication:
        return 'Face ID';
      case BiometryType.irisAuthentication:
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
