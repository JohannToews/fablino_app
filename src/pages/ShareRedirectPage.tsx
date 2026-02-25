 import { useEffect, useState } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { Loader2, AlertCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { useKidProfile } from "@/hooks/useKidProfile";
 import { toast } from "sonner";
 import ImportPreview from "@/components/story-sharing/ImportPreview";
 import { Language } from "@/lib/translations";
 
 /**
  * Page for handling direct share links (/s/:token).
  * Displays story preview and allows import if user is logged in.
  */
 
 interface SharedStoryData {
   title: string;
   content: string;
   difficulty: string;
   text_language: string;
   cover_image_url?: string;
 }
 
 const translations: Record<Language, {
   loading: string;
   expired: string;
   notFound: string;
   error: string;
   loginRequired: string;
   goToLogin: string;
   importSuccess: string;
   backHome: string;
 }> = {
   de: {
     loading: "Geschichte wird geladen...",
     expired: "Dieser Teilen-Code ist leider abgelaufen. Bitte frag nach einem neuen!",
     notFound: "Geschichte nicht gefunden",
     error: "Fehler beim Laden der Geschichte",
     loginRequired: "Bitte melde dich an, um diese Geschichte zu importieren",
     goToLogin: "Zur Anmeldung",
     importSuccess: "Geschichte erfolgreich zu deiner Bibliothek hinzugefügt!",
     backHome: "Zurück zur Startseite",
   },
   fr: {
     loading: "Chargement de l'histoire...",
     expired: "Ce code de partage a malheureusement expiré. Demande un nouveau!",
     notFound: "Histoire non trouvée",
     error: "Erreur lors du chargement de l'histoire",
     loginRequired: "Connecte-toi pour importer cette histoire",
     goToLogin: "Se connecter",
     importSuccess: "Histoire ajoutée à ta bibliothèque!",
     backHome: "Retour à l'accueil",
   },
   en: {
     loading: "Loading story...",
     expired: "This share code has expired. Please ask for a new one!",
     notFound: "Story not found",
     error: "Error loading story",
     loginRequired: "Please log in to import this story",
     goToLogin: "Go to Login",
     importSuccess: "Story successfully added to your library!",
     backHome: "Back to Home",
   },
   es: {
     loading: "Cargando historia...",
     expired: "Este código ha expirado. ¡Pide uno nuevo!",
     notFound: "Historia no encontrada",
     error: "Error al cargar la historia",
     loginRequired: "Inicia sesión para importar esta historia",
     goToLogin: "Iniciar sesión",
     importSuccess: "¡Historia añadida a tu biblioteca!",
     backHome: "Volver al inicio",
   },
   nl: {
     loading: "Verhaal laden...",
     expired: "Deze deelcode is verlopen. Vraag om een nieuwe!",
     notFound: "Verhaal niet gevonden",
     error: "Fout bij laden van verhaal",
     loginRequired: "Log in om dit verhaal te importeren",
     goToLogin: "Inloggen",
     importSuccess: "Verhaal toegevoegd aan je bibliotheek!",
     backHome: "Terug naar home",
   },
   it: {
     loading: "Caricamento storia...",
     expired: "Questo codice è scaduto. Chiedi uno nuovo!",
     notFound: "Storia non trovata",
     error: "Errore nel caricamento della storia",
     loginRequired: "Accedi per importare questa storia",
     goToLogin: "Accedi",
     importSuccess: "Storia aggiunta alla tua libreria!",
     backHome: "Torna alla home",
   },
  bs: {
    loading: "Učitavanje priče...",
    expired: "Ovaj kod je istekao. Traži novi!",
    notFound: "Priča nije pronađena",
    error: "Greška pri učitavanju priče",
    loginRequired: "Prijavi se da uvezeš ovu priču",
    goToLogin: "Prijava",
    importSuccess: "Priča dodana u tvoju biblioteku!",
    backHome: "Nazad na početnu",
  },
  pt: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  sk: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  bg: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  ca: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  hu: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  lt: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  pl: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  ro: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  sl: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  tr: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  ru: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
  uk: { loading: "Loading story...", expired: "This share code has expired. Please ask for a new one!", notFound: "Story not found", error: "Error loading story", loginRequired: "Please log in to import this story", goToLogin: "Go to Login", importSuccess: "Story successfully added to your library!", backHome: "Back to Home" },
 };
 
 export default function ShareRedirectPage() {
   const { token } = useParams<{ token: string }>();
   const navigate = useNavigate();
   const { user, isAuthenticated } = useAuth();
   const { selectedProfileId, kidAppLanguage } = useKidProfile();
 
   const [isLoading, setIsLoading] = useState(true);
   const [isImporting, setIsImporting] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isExpired, setIsExpired] = useState(false);
   const [storyData, setStoryData] = useState<SharedStoryData | null>(null);
 
   const t = translations[kidAppLanguage] || translations.de;
 
   useEffect(() => {
     if (token) {
       loadSharedStory();
     }
   }, [token]);
 
   const loadSharedStory = async () => {
     try {
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-share?token=${token}`,
         {
           headers: {
             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
         }
       );
 
       const data = await response.json();
 
       if (!response.ok) {
         if (data.expired) {
           setIsExpired(true);
           setError(t.expired);
         } else {
           setError(t.notFound);
         }
         return;
       }
 
       setStoryData(data);
     } catch (err) {
       console.error("Load error:", err);
       setError(t.error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleImport = async () => {
     if (!user?.id || !token) return;
 
     setIsImporting(true);
     try {
       const { data, error } = await supabase.functions.invoke("import-story", {
         body: {
           share_token: token,
           user_id: user.id,
           kid_profile_id: selectedProfileId,
         },
       });
 
       if (error || data?.error) {
         if (data?.expired) {
           setIsExpired(true);
           setError(t.expired);
         } else {
           throw new Error(data?.error || error?.message);
         }
         return;
       }
 
       toast.success(t.importSuccess);
       navigate(`/read/${data.story_id}`);
     } catch (err) {
       console.error("Import error:", err);
       toast.error(t.error);
     } finally {
       setIsImporting(false);
     }
   };
 
   // Loading state
   if (isLoading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
         <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
         <p className="text-muted-foreground">{t.loading}</p>
       </div>
     );
   }
 
   // Error state
   if (error) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
         <div className={`p-6 rounded-full mb-6 ${isExpired ? "bg-amber-100" : "bg-destructive/10"}`}>
           <AlertCircle className={`h-16 w-16 ${isExpired ? "text-amber-600" : "text-destructive"}`} />
         </div>
         <p className="text-lg text-center text-muted-foreground max-w-md mb-6">{error}</p>
         <Button onClick={() => navigate("/")}>{t.backHome}</Button>
       </div>
     );
   }
 
   // Not logged in state
   if (!isAuthenticated && storyData) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
         <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-6">
           <h2 className="text-2xl font-baloo font-bold mb-4">{storyData.title}</h2>
           <p className="text-muted-foreground mb-6">{t.loginRequired}</p>
           <div className="flex gap-3">
             <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
               {t.backHome}
             </Button>
             <Button onClick={() => navigate("/login")} className="flex-1">
               {t.goToLogin}
             </Button>
           </div>
         </div>
       </div>
     );
   }
 
   // Preview and import state
   if (storyData) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
         <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-6">
           <ImportPreview
             story={storyData}
             language={kidAppLanguage}
             isImporting={isImporting}
             onImport={handleImport}
             onCancel={() => navigate("/")}
           />
         </div>
       </div>
     );
   }
 
   return null;
 }