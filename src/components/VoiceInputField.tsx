import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceInputFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
  multiline?: boolean;
}

const VoiceInputField = ({
  label,
  value,
  onChange,
  placeholder,
  language = "de",
  multiline = false,
}: VoiceInputFieldProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use webm format, fall back to whatever is supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speech-to-text`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      
      if (data.text) {
        // Append to existing value if there's already text
        const newValue = value ? `${value} ${data.text}` : data.text;
        onChange(newValue);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error(
        language === "de" ? "Transkription fehlgeschlagen" :
        language === "fr" ? "Échec de la transcription" :
        "Transcription failed"
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="space-y-2">
      {label && <Label className="text-base font-medium">{label}</Label>}
      <div className="flex gap-2">
        <InputComponent
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={multiline ? "min-h-[100px] text-base" : "text-base"}
        />
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className="flex-shrink-0 h-10 w-10"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isRecording ? (
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
