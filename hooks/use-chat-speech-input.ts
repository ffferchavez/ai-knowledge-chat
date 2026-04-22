"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function useChatSpeechInput(appendText: (fragment: string) => void) {
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    const W = window as unknown as {
      SpeechRecognition?: SpeechRecConstructor;
      webkitSpeechRecognition?: SpeechRecConstructor;
    };
    return typeof (W.SpeechRecognition ?? W.webkitSpeechRecognition) !== "undefined";
  });
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecConstructor> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !supported) return;
    const W = window as unknown as {
      SpeechRecognition?: SpeechRecConstructor;
      webkitSpeechRecognition?: SpeechRecConstructor;
    };
    const SpeechRecognitionCtor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const rec = new SpeechRecognitionCtor();
    rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        // noop
      }
      recognitionRef.current = null;
    };
  }, [supported]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // noop
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.onresult = (event: Event) => {
      const ev = event as unknown as {
        resultIndex: number;
        results: Array<{ 0: { transcript: string }; isFinal: boolean }>;
      };
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        if (!ev.results[i].isFinal) continue;
        const piece = ev.results[i][0].transcript;
        if (piece) appendText(piece);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [appendText]);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (listening) stop();
    else start();
  }, [supported, listening, start, stop]);

  return { supported, listening, toggle, stop };
}
