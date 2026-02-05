 import { useState } from "react";
 import { Share2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { useAuth } from "@/hooks/useAuth";
 import QRCodeModal from "./QRCodeModal";
 import { Language } from "@/lib/translations";
 
 /**
  * Button component that generates a QR code share link for a story.
  * Shows QRCodeModal with the generated share token on success.
  * 
  * @param storyId - The ID of the story to share
  * @param language - Current app language for translations
  */
 interface ShareStoryButtonProps {
   storyId: string;
   language: Language;
 }
 
 const translations: Record<Language, {
   share: string;
   generating: string;
   error: string;
 }> = {
   de: { share: "Teilen", generating: "Erstelle Link...", error: "Fehler beim Erstellen des Links" },
   fr: { share: "Partager", generating: "Création du lien...", error: "Erreur lors de la création du lien" },
   en: { share: "Share", generating: "Creating link...", error: "Error creating share link" },
   es: { share: "Compartir", generating: "Creando enlace...", error: "Error al crear el enlace" },
   nl: { share: "Delen", generating: "Link maken...", error: "Fout bij maken van link" },
   it: { share: "Condividi", generating: "Creazione link...", error: "Errore nella creazione del link" },
   bs: { share: "Podijeli", generating: "Kreiranje linka...", error: "Greška pri kreiranju linka" },
 };
 
 export default function ShareStoryButton({ storyId, language }: ShareStoryButtonProps) {
   const { user } = useAuth();
   const [isLoading, setIsLoading] = useState(false);
   const [shareData, setShareData] = useState<{ token: string; expiresAt: string } | null>(null);
   const [showModal, setShowModal] = useState(false);
 
   const t = translations[language] || translations.de;
 
   const handleShare = async () => {
     if (!user?.id) {
       toast.error("Please log in to share stories");
       return;
     }
 
     setIsLoading(true);
     try {
       const { data, error } = await supabase.functions.invoke("create-share", {
         body: { story_id: storyId, user_id: user.id },
       });
 
       if (error || data?.error) {
         throw new Error(data?.error || error?.message || "Unknown error");
       }
 
       setShareData({
         token: data.share_token,
         expiresAt: data.expires_at,
       });
       setShowModal(true);
     } catch (error) {
       console.error("Share error:", error);
       toast.error(t.error);
     } finally {
       setIsLoading(false);
     }
   };
 
   return (
     <>
       <Button
        variant="secondary"
         onClick={handleShare}
         disabled={isLoading}
        className="gap-2 flex items-center"
       >
         <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">{isLoading ? t.generating : t.share}</span>
       </Button>
 
       {shareData && (
         <QRCodeModal
           isOpen={showModal}
           onClose={() => setShowModal(false)}
           shareToken={shareData.token}
           expiresAt={shareData.expiresAt}
           language={language}
         />
       )}
     </>
   );
 }