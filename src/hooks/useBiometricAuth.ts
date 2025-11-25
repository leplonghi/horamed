import { useState, useEffect } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Simple encryption utilities using Web Crypto API
const encryptToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Generate a device-specific key from browser fingerprint
  const fingerprint = await getDeviceFingerprint();
  const keyMaterial = encoder.encode(fingerprint);
  
  const key = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', keyMaterial),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

const decryptToken = async (encryptedData: string): Promise<string | null> => {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const fingerprint = await getDeviceFingerprint();
    const keyMaterial = encoder.encode(fingerprint);
    
    const key = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', keyMaterial),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

const getDeviceFingerprint = async (): Promise<string> => {
  // Generate device fingerprint from various browser properties
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth.toString(),
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ];
  
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

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
      // Get current session to store refresh token with 4-hour expiry for healthcare data security
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.refresh_token) {
        const encrypted = await encryptToken(session.refresh_token);
        const expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + (4 * 60 * 60 * 1000)); // 4-hour expiry for medical data security
        
        localStorage.setItem("biometric_refresh_token", encrypted);
        localStorage.setItem("biometric_expiry", expiryDate.getTime().toString());
        localStorage.setItem("biometric_enabled", "true");
        toast({
          title: "Biometria ativada",
          description: "Login por biometria ativado por 4 horas para proteger seus dados médicos.",
        });
      }
    }
  };

  const loginWithBiometric = async () => {
    const encryptedToken = localStorage.getItem("biometric_refresh_token");
    const expiryTimestamp = localStorage.getItem("biometric_expiry");
    
    if (!encryptedToken || !expiryTimestamp) {
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
      localStorage.removeItem("biometric_refresh_token");
      localStorage.removeItem("biometric_expiry");
      localStorage.removeItem("biometric_enabled");
      toast({
        title: "Sessão biométrica expirada",
        description: "Por segurança de dados médicos, faça login novamente",
        variant: "destructive",
      });
      return false;
    }

    const success = await authenticate();
    if (success) {
      const refreshToken = await decryptToken(encryptedToken);
      if (!refreshToken) {
        localStorage.removeItem("biometric_refresh_token");
        localStorage.removeItem("biometric_expiry");
        localStorage.removeItem("biometric_enabled");
        toast({
          title: "Erro de segurança",
          description: "Falha ao descriptografar credenciais. Faça login novamente.",
          variant: "destructive",
        });
        return false;
      }

      // Use refresh token to restore session
      const { error } = await supabase.auth.setSession({
        access_token: refreshToken,
        refresh_token: refreshToken,
      });

      if (error) {
        // If refresh token expired, clear and ask to login again
        localStorage.removeItem("biometric_refresh_token");
        localStorage.removeItem("biometric_expiry");
        localStorage.removeItem("biometric_enabled");
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para reativar a biometria",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      return true;
    }
    return false;
  };

  const disableBiometric = () => {
    localStorage.removeItem("biometric_refresh_token");
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
