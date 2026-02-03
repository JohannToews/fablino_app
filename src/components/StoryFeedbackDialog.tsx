import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Language } from "@/lib/translations";

interface StoryFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  storyId: string;
  storyTitle: string;
  storyPrompt?: string;
  userId: string;
  kidProfileId?: string;
  kidName?: string;
  kidSchoolClass?: string;
  kidSchoolSystem?: string;
  language: Language;
}

const translations: Record<Language, {
  title: string;
  description: string;
  qualityLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  skip: string;
  submit: string;
  thankYou: string;
  listening: string;
}> = {
  de: {
    title: "Wie war die Geschichte?",
    description: "Dein Feedback hilft uns, bessere Geschichten zu erstellen!",
    qualityLabel: "Qualität der Geschichte",
    commentLabel: "Kommentar (optional)",
    commentPlaceholder: "Was hat dir gefallen oder nicht gefallen?",
    skip: "Überspringen",
    submit: "Absenden",
    thankYou: "Danke für dein Feedback!",
    listening: "Ich höre zu...",
  },
  fr: {
    title: "Comment était l'histoire?",
    description: "Tes commentaires nous aident à créer de meilleures histoires!",
    qualityLabel: "Qualité de l'histoire",
    commentLabel: "Commentaire (optionnel)",
    commentPlaceholder: "Qu'est-ce qui t'a plu ou pas?",
    skip: "Passer",
    submit: "Envoyer",
    thankYou: "Merci pour ton avis!",
    listening: "J'écoute...",
  },
  en: {
    title: "How was the story?",
    description: "Your feedback helps us create better stories!",
    qualityLabel: "Story quality",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "What did you like or dislike?",
    skip: "Skip",
    submit: "Submit",
    thankYou: "Thanks for your feedback!",
    listening: "Listening...",
  },
  es: {
    title: "¿Cómo fue la historia?",
    description: "¡Tus comentarios nos ayudan a crear mejores historias!",
    qualityLabel: "Calidad de la historia",
    commentLabel: "Comentario (opcional)",
    commentPlaceholder: "¿Qué te gustó o no te gustó?",
    skip: "Saltar",
    submit: "Enviar",
    thankYou: "¡Gracias por tu opinión!",
    listening: "Escuchando...",
  },
  nl: {
    title: "Hoe was het verhaal?",
    description: "Je feedback helpt ons betere verhalen te maken!",
    qualityLabel: "Kwaliteit van het verhaal",
    commentLabel: "Opmerking (optioneel)",
    commentPlaceholder: "Wat vond je leuk of niet leuk?",
    skip: "Overslaan",
    submit: "Versturen",
    thankYou: "Bedankt voor je feedback!",
    listening: "Ik luister...",
  },
  it: {
    title: "Com'era la storia?",
    description: "Il tuo feedback ci aiuta a creare storie migliori!",
    qualityLabel: "Qualità della storia",
    commentLabel: "Commento (opzionale)",
    commentPlaceholder: "Cosa ti è piaciuto o non piaciuto?",
    skip: "Salta",
    submit: "Invia",
    thankYou: "Grazie per il tuo feedback!",
    listening: "Sto ascoltando...",
  },
};

// Language code mapping for speech recognition
const languageToLocale: Record<string, string> = {
  de: "de-DE",
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  nl: "nl-NL",
  it: "it-IT",
};

const StoryFeedbackDialog = ({
  open,
  onClose,
  onSubmit,
  storyId,
  storyTitle,
  storyPrompt,
  userId,
  kidProfileId,
  kidName,
  kidSchoolClass,
  kidSchoolSystem,
  language,
}: StoryFeedbackDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const t = translations[language] || translations.fr;

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = languageToLocale[language] || "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setComment(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(language === 'de' ? 'Bitte wähle eine Bewertung' : 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("story_ratings").insert({
        user_id: userId,
        kid_profile_id: kidProfileId || null,
        story_id: storyId,
        story_title: storyTitle,
        story_prompt: storyPrompt || null,
        kid_name: kidName || null,
        kid_school_class: kidSchoolClass || null,
        kid_school_system: kidSchoolSystem || null,
        quality_rating: rating,
        weakest_part: null,
        weakness_reason: comment || null,
      });

      if (error) throw error;

      toast.success(t.thankYou);
      onSubmit();
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Error saving feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-baloo">{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.qualityLabel}</label>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-sunshine text-sunshine"
                        : "text-muted-foreground/30"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment with Voice Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.commentLabel}</label>
            <div className="relative">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                className="min-h-[80px] pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={startVoiceInput}
                disabled={isListening}
                className={`absolute right-2 top-2 ${isListening ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
              >
                {isListening ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-sm text-primary flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t.listening}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            {t.skip}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {t.submit}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryFeedbackDialog;
