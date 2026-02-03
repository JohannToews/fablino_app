import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
  multiline?: boolean;
}

// Map language codes to speech recognition language codes
const getRecognitionLang = (lang: string): string => {
  const langMap: Record<string, string> = {
    de: "de-DE",
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    nl: "nl-NL",
    it: "it-IT",
    bs: "bs-BA",
  };
  return langMap[lang] || "de-DE";
};

// Error messages per language
const errorMessages: Record<string, {
  noSupport: string;
  noMic: string;
  noSpeech: string;
  error: string;
  recording: string;
}> = {
  de: {
    noSupport: "Spracherkennung nicht unterstützt",
    noMic: "Mikrofon nicht verfügbar",
    noSpeech: "Ich habe nichts gehört. Versuch es nochmal!",
    error: "Spracherkennung fehlgeschlagen",
    recording: "🎤 Sprich jetzt...",
  },
  fr: {
    noSupport: "Reconnaissance vocale non supportée",
    noMic: "Microphone non disponible",
    noSpeech: "Je n'ai rien entendu. Essaie encore!",
    error: "Échec de la reconnaissance vocale",
    recording: "🎤 Parle maintenant...",
  },
  en: {
    noSupport: "Speech recognition not supported",
    noMic: "Microphone not available",
    noSpeech: "I didn't hear anything. Try again!",
    error: "Speech recognition failed",
    recording: "🎤 Speak now...",
  },
  es: {
    noSupport: "Reconocimiento de voz no soportado",
    noMic: "Micrófono no disponible",
    noSpeech: "No escuché nada. ¡Intenta de nuevo!",
    error: "Reconocimiento de voz fallido",
    recording: "🎤 Habla ahora...",
  },
  nl: {
    noSupport: "Spraakherkenning niet ondersteund",
    noMic: "Microfoon niet beschikbaar",
    noSpeech: "Ik hoorde niets. Probeer het opnieuw!",
    error: "Spraakherkenning mislukt",
    recording: "🎤 Spreek nu...",
  },
  it: {
    noSupport: "Riconoscimento vocale non supportato",
    noMic: "Microfono non disponibile",
    noSpeech: "Non ho sentito niente. Riprova!",
    error: "Riconoscimento vocale fallito",
    recording: "🎤 Parla ora...",
  },
  bs: {
    noSupport: "Prepoznavanje govora nije podržano",
    noMic: "Mikrofon nije dostupan",
    noSpeech: "Nisam ništa čuo/la. Pokušaj ponovo!",
    error: "Prepoznavanje govora nije uspjelo",
    recording: "🎤 Govori sada...",
  },
};

const VoiceInputField = ({
  label,
  value,
  onChange,
  placeholder,
  language = "de",
  multiline = false,
}: VoiceInputFieldProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false);
  
  const msgs = errorMessages[language] || errorMessages.de;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const startRecording = async () => {
    // Check if SpeechRecognition is available
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error(msgs.noSupport);
      return;
    }

    // Request microphone permission explicitly (important for tablets/mobile)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Microphone permission error:", error);
      toast.error(msgs.noMic);
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }

    shouldRestartRef.current = true;
    createAndStartRecognition();
  };

  const createAndStartRecognition = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = getRecognitionLang(language);
    recognition.continuous = false; // Use non-continuous for better reliability
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Update interim display
      setInterimTranscript(interimText);

      // Append final results to the value
      if (finalTranscript) {
        const newValue = value ? `${value} ${finalTranscript}`.trim() : finalTranscript;
        onChange(newValue);
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "no-speech") {
        // No speech detected - restart if still recording
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current) {
              createAndStartRecognition();
            }
          }, 100);
        }
        return;
      }
      
      if (event.error === "aborted") {
        // Silently handle aborted - usually from manual stop
        return;
      }
      
      if (event.error === "not-allowed") {
        toast.error(msgs.noMic);
      } else {
        toast.error(msgs.error);
      }
      
      shouldRestartRef.current = false;
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Auto-restart if user hasn't stopped
      if (shouldRestartRef.current) {
        setTimeout(() => {
          if (shouldRestartRef.current) {
            createAndStartRecognition();
          }
        }, 100);
      } else {
        setIsRecording(false);
        setInterimTranscript("");
      }
    };

    recognitionRef.current = recognition;
    
    // Small delay for tablets to ensure audio context is ready
    setTimeout(() => {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        toast.error(msgs.error);
        setIsRecording(false);
        shouldRestartRef.current = false;
      }
    }, 100);
  };

  const stopRecording = () => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    setIsRecording(false);
    setInterimTranscript("");
  };

  const InputComponent = multiline ? Textarea : Input;

  // Display value with interim transcript
  const displayValue = isRecording && interimTranscript 
    ? `${value}${value ? " " : ""}${interimTranscript}`
    : value;

  return (
    <div className="space-y-2">
      {label && <Label className="text-base font-medium">{label}</Label>}
      <div className="flex gap-2">
        <InputComponent
          value={displayValue}
          onChange={(e) => {
            if (!isRecording) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          className={multiline ? "min-h-[100px] text-base" : "text-base"}
          readOnly={isRecording}
        />
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className="flex-shrink-0 h-10 w-10"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
      {isRecording && (
        <p className="text-sm text-primary animate-pulse">
          {msgs.recording}
        </p>
      )}
    </div>
  );
};

export default VoiceInputField;
