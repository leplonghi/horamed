import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useVoiceInputAI } from "./useVoiceInputAI";
import { useVoiceInputNative } from "./useVoiceInputNative";

type Mode = "ai" | "native";

function canUseAIRecording(): boolean {
  // MediaRecorder is not available on some browsers (notably older iOS Safari).
  return typeof window !== "undefined" &&
    "mediaDevices" in navigator &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof (window as any).MediaRecorder !== "undefined";
}

/**
 * Adaptive voice input:
 * - Uses AI transcription (MediaRecorder + backend) when supported.
 * - Falls back to native Web Speech API when MediaRecorder isn't supported.
 */
export function useVoiceInput(options: Parameters<typeof useVoiceInputAI>[0] & Parameters<typeof useVoiceInputNative>[0] = {}) {
  const [mode, setMode] = useState<Mode>(() => (canUseAIRecording() ? "ai" : "native"));

  // Instantiate both hooks unconditionally (rules of hooks).
  const native = useVoiceInputNative(options);
  const ai = useVoiceInputAI({
    ...options,
    onError: (err) => {
      // If AI path fails due to recording support, switch to native.
      const msg = String(err || "");
      const m = msg.toLowerCase();

      // We should also fall back when AI transcription is temporarily unavailable
      // (rate limit/quota/overload), so voice input keeps working via Web Speech API.
      const looksLikeNeedsFallback =
        m.includes("mediarecorder") ||
        m.includes("not supported") ||
        m.includes("mime") ||
        m.includes("grava") ||
        m.includes("record") ||
        m.includes("rate limit") ||
        m.includes("ratelimit") ||
        m.includes("quota") ||
        m.includes("429") ||
        m.includes("temporariamente") ||
        m.includes("ocupado");

      if (looksLikeNeedsFallback && mode !== "native") {
        setMode("native");
        toast.info("Ativei o modo compatível (reconhecimento nativo).", { duration: 2000 });
      }

      options.onError?.(msg);
    },
  });

  // If browser doesn't support MediaRecorder, force native.
  useEffect(() => {
    if (!canUseAIRecording() && mode !== "native") setMode("native");
  }, [mode]);

  return useMemo(() => (mode === "ai" ? ai : native), [ai, native, mode]);
}

export { useVoiceInputAI, useVoiceInputNative };
