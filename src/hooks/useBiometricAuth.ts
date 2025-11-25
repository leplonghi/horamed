import { useState, useEffect } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Removed encryption utilities - no longer storing sensitive tokens in localStorage
// Healthcare data security prioritizes requiring re-authentication over convenience

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable && result.biometryType !== 0);
    } catch (error) {
      setIsAvailable(false);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await BiometricAuth.authenticate({
        reason: "Autenticar no HoraMed",
        cancelTitle: "Cancelar",
        allowDeviceCredential: true,
        iosFallbackTitle: "Usar senha",
        androidTitle: "Autenticação biométrica",
      });
      return true;
    } catch (error) {
      console.error("Biometric auth failed:", error);
      toast({
        title: "Falha na autenticação",
        description: "Não foi possível autenticar com biometria",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setupBiometricLogin = async (email: string, password: string) => {
    const success = await authenticate();
    if (success) {
      // Store only email and 4-hour expiry - no tokens for healthcare data security
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + (4 * 60 * 60 * 1000));
      
      localStorage.setItem("biometric_email", email);
      localStorage.setItem("biometric_expiry", expiryDate.getTime().toString());
      localStorage.setItem("biometric_enabled", "true");
      toast({
        title: "Biometria ativada",
        description: "Autenticação biométrica configurada. Você precisará confirmar sua senha após 4 horas.",
      });
    }
  };

  const loginWithBiometric = async () => {
    const email = localStorage.getItem("biometric_email");
    const expiryTimestamp = localStorage.getItem("biometric_expiry");
    
    if (!email || !expiryTimestamp) {
      toast({
        title: "Erro",
        description: "Biometria não configurada",
        variant: "destructive",
      });
      return false;
    }

    // Check if biometric session has expired (4 hours for medical data security)
    const now = Date.now();
    const expiry = parseInt(expiryTimestamp, 10);
    
    if (now > expiry) {
      localStorage.removeItem("biometric_email");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast({
        title: "Sessão biométrica expirada",
        description: "Por segurança de dados médicos, faça login novamente",
        variant: "destructive",
      });
      return false;
    }

    // Authenticate with biometrics, then return email for password re-entry
    const success = await authenticate();
    if (success) {
      // Return email so login form can pre-fill it - user still needs to enter password
      // This provides convenience while maintaining security for healthcare data
      return { requiresPassword: true, email };
    }
    return false;
  };

  const disableBiometric = () => {
    localStorage.removeItem("biometric_email");
    localStorage.removeItem("biometric_expiry");
    localStorage.removeItem("biometric_enabled");
    toast({
      title: "Biometria desativada",
      description: "Login por biometria foi removido",
    });
  };

  const isBiometricEnabled = () => {
    return localStorage.getItem("biometric_enabled") === "true";
  };

  return {
    isAvailable,
    isLoading,
    authenticate,
    setupBiometricLogin,
    loginWithBiometric,
    disableBiometric,
    isBiometricEnabled: isBiometricEnabled(),
  };
};
