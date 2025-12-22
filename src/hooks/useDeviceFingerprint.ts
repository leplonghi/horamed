import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFingerprint = async () => {
      try {
        // Check localStorage first for cached fingerprint
        const cached = localStorage.getItem('device_fingerprint');
        if (cached) {
          setFingerprint(cached);
          setLoading(false);
          return;
        }

        // Generate new fingerprint
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        
        // Store in localStorage for consistency
        localStorage.setItem('device_fingerprint', result.visitorId);
        setFingerprint(result.visitorId);
      } catch (error) {
        console.error('Error loading fingerprint:', error);
        // Fallback to UUID if fingerprint fails
        const fallbackId = crypto.randomUUID();
        localStorage.setItem('device_fingerprint', fallbackId);
        setFingerprint(fallbackId);
      } finally {
        setLoading(false);
      }
    };

    loadFingerprint();
  }, []);

  return { fingerprint, loading };
}
