import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type SpeechRecognitionType = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionType | null {
  const windowWithSpeech = window as unknown as { 
    SpeechRecognition?: SpeechRecognitionType; 
    webkitSpeechRecognition?: SpeechRecognitionType 
  };
  return windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition || null;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const hasResultsRef = useRef<boolean>(false);

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Web Speech API not supported in this browser');
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const SpeechRecognition = getSpeechRecognition();

      if (!SpeechRecognition) {
        toast.error('Reconhecimento de voz não suportado neste navegador');
        options.onError?.('Web Speech API not supported');
        return;
      }

      // Request microphone permission first
      try {
        console.log('Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
      } catch (err) {
        console.error('Microphone access error:', err);
        toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
        options.onError?.('Microphone access denied');
        return;
      }

      // Reset state
      finalTranscriptRef.current = '';
      hasResultsRef.current = false;
      setTranscription('');

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = options.language || 'pt-BR';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setIsProcessing(false);
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        toast.info('Ouvindo... Fale agora', { duration: 2000 });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        hasResultsRef.current = true;
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscriptRef.current += transcript + ' ';
            console.log('Final transcript:', transcript);
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscriptRef.current + interimTranscript).trim();
        if (currentText) {
          setTranscription(currentText);
          console.log('Current transcription:', currentText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Erro no reconhecimento de voz';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Permissão de microfone negada. Por favor, permita o acesso ao microfone.';
            break;
          case 'no-speech':
            // Don't show error for no-speech, just info
            if (!hasResultsRef.current) {
              toast.info('Nenhuma fala detectada. Tente novamente.');
            }
            setIsRecording(false);
            setIsProcessing(false);
            return;
          case 'network':
            errorMessage = 'Erro de conexão. Verifique sua internet.';
            break;
          case 'aborted':
            // User aborted, no need to show error
            setIsRecording(false);
            setIsProcessing(false);
            return;
          case 'audio-capture':
            errorMessage = 'Microfone não encontrado. Verifique se está conectado.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Serviço de reconhecimento não disponível.';
            break;
        }
        
        toast.error(errorMessage);
        options.onError?.(event.error);
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        setIsProcessing(false);
        
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          console.log('Final transcription result:', finalText);
          setTranscription(finalText);
          options.onTranscription?.(finalText);
          toast.success('Voz reconhecida!', { duration: 1500 });
        } else if (hasResultsRef.current) {
          console.log('Had results but no final text');
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
        
        recognitionRef.current = null;
      };

      recognition.start();
      console.log('Recognition.start() called');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar gravação';
      toast.error('Não foi possível iniciar o reconhecimento de voz');
      options.onError?.(errorMessage);
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording, isRecording:', isRecording);
    if (recognitionRef.current) {
      setIsProcessing(true);
      try {
        recognitionRef.current.stop();
        console.log('Recognition.stop() called');
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsRecording(false);
        setIsProcessing(false);
      }
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    console.log('Toggle recording, current state:', isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearTranscription = useCallback(() => {
    setTranscription('');
    finalTranscriptRef.current = '';
    hasResultsRef.current = false;
  }, []);

  return {
    isRecording,
    isProcessing,
    transcription,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscription,
  };
}
