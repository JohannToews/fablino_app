import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Loader2 } from "lucide-react";
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Check if SpeechRecognition is available
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        toast.error(
          language === "de" ? "Spracherkennung nicht unterstützt" :
          language === "fr" ? "Reconnaissance vocale non supportée" :
          "Speech recognition not supported"
        );
        return;
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getRecognitionLang(language);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        // Update interim display
        setInterimTranscript(interim);

        // Append final results to the value
        if (final) {
          const newValue = value ? `${value} ${final}`.trim() : final;
          onChange(newValue);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "aborted") {
          toast.error(
            language === "de" ? "Spracherkennung fehlgeschlagen" :
            language === "fr" ? "Échec de la reconnaissance vocale" :
            "Speech recognition failed"
          );
        }
        setIsRecording(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error(
        language === "de" ? "Mikrofon nicht verfügbar" :
        language === "fr" ? "Microphone non disponible" :
        "Microphone not available"
      );
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript("");
    }
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
          {language === "de" ? "🎤 Aufnahme läuft..." :
           language === "fr" ? "🎤 Enregistrement..." :
           "🎤 Recording..."}
        </p>
      )}
    </div>
  );
};

export default VoiceInputField;
