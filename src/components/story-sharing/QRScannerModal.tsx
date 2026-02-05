 import { useState, useEffect, useRef } from "react";
 import { Html5Qrcode } from "html5-qrcode";
 import { X, AlertCircle, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { useKidProfile } from "@/hooks/useKidProfile";
 import { toast } from "sonner";
 import { Language } from "@/lib/translations";
 import ImportPreview from "./ImportPreview";
 
 /**
  * Modal with QR scanner for importing shared stories.
  * Handles scanning, validation, preview, and import flow.
  * 
  * @param isOpen - Whether the modal is visible
  * @param onClose - Callback to close the modal
  * @param language - Current app language for translations
  * @param onImportSuccess - Callback with new story ID on successful import
  */
 interface QRScannerModalProps {
   isOpen: boolean;
   onClose: () => void;
   language: Language;
   onImportSuccess?: (storyId: string) => void;
 }
 
 interface SharedStoryData {
   title: string;
   content: string;
   difficulty: string;
   text_language: string;
   cover_image_url?: string;
 }
 
 const translations: Record<Language, {
   title: string;
   scanning: string;
   expired: string;
   notFound: string;
   error: string;
   cameraError: string;
   importing: string;
   importSuccess: string;
   cancel: string;
 }> = {
   de: {
     title: "QR-Code scannen",
     scanning: "Kamera wird gestartet...",
     expired: "Dieser Teilen-Code ist leider abgelaufen. Bitte frag nach einem neuen!",
     notFound: "Ungültiger QR-Code",
     error: "Fehler beim Laden der Geschichte",
     cameraError: "Kamera konnte nicht gestartet werden",
     importing: "Wird importiert...",
     importSuccess: "Geschichte erfolgreich hinzugefügt!",
     cancel: "Abbrechen",
   },
   fr: {
     title: "Scanner le QR code",
     scanning: "Démarrage de la caméra...",
     expired: "Ce code de partage a malheureusement expiré. Demande un nouveau!",
     notFound: "QR code invalide",
     error: "Erreur lors du chargement de l'histoire",
     cameraError: "Impossible de démarrer la caméra",
     importing: "Importation en cours...",
     importSuccess: "Histoire ajoutée avec succès!",
     cancel: "Annuler",
   },
   en: {
     title: "Scan QR Code",
     scanning: "Starting camera...",
     expired: "This share code has expired. Please ask for a new one!",
     notFound: "Invalid QR code",
     error: "Error loading story",
     cameraError: "Could not start camera",
     importing: "Importing...",
     importSuccess: "Story successfully added!",
     cancel: "Cancel",
   },
   es: {
     title: "Escanear código QR",
     scanning: "Iniciando cámara...",
     expired: "Este código ha expirado. ¡Pide uno nuevo!",
     notFound: "Código QR inválido",
     error: "Error al cargar la historia",
     cameraError: "No se pudo iniciar la cámara",
     importing: "Importando...",
     importSuccess: "¡Historia añadida con éxito!",
     cancel: "Cancelar",
   },
   nl: {
     title: "QR-code scannen",
     scanning: "Camera starten...",
     expired: "Deze deelcode is verlopen. Vraag om een nieuwe!",
     notFound: "Ongeldige QR-code",
     error: "Fout bij laden van verhaal",
     cameraError: "Kon camera niet starten",
     importing: "Importeren...",
     importSuccess: "Verhaal succesvol toegevoegd!",
     cancel: "Annuleren",
   },
   it: {
     title: "Scansiona codice QR",
     scanning: "Avvio fotocamera...",
     expired: "Questo codice è scaduto. Chiedi uno nuovo!",
     notFound: "Codice QR non valido",
     error: "Errore nel caricamento della storia",
     cameraError: "Impossibile avviare la fotocamera",
     importing: "Importazione...",
     importSuccess: "Storia aggiunta con successo!",
     cancel: "Annulla",
   },
   bs: {
     title: "Skeniraj QR kod",
     scanning: "Pokretanje kamere...",
     expired: "Ovaj kod je istekao. Traži novi!",
     notFound: "Nevažeći QR kod",
     error: "Greška pri učitavanju priče",
     cameraError: "Nije moguće pokrenuti kameru",
     importing: "Uvoz...",
     importSuccess: "Priča uspješno dodana!",
     cancel: "Otkaži",
   },
 };
 
 export default function QRScannerModal({
   isOpen,
   onClose,
   language,
   onImportSuccess,
 }: QRScannerModalProps) {
   const { user } = useAuth();
   const { selectedProfileId } = useKidProfile();
   const t = translations[language] || translations.de;
 
   const [isScanning, setIsScanning] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isExpired, setIsExpired] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [storyPreview, setStoryPreview] = useState<SharedStoryData | null>(null);
   const [shareToken, setShareToken] = useState<string | null>(null);
   const [isImporting, setIsImporting] = useState(false);
 
   const scannerRef = useRef<Html5Qrcode | null>(null);
   const scannerContainerId = "qr-scanner-container";
 
   // Extract share token from URL
   const extractToken = (url: string): string | null => {
     try {
       const urlObj = new URL(url);
       const pathParts = urlObj.pathname.split("/");
       const sIndex = pathParts.indexOf("s");
       if (sIndex !== -1 && pathParts[sIndex + 1]) {
         return pathParts[sIndex + 1];
       }
     } catch {
       // If not a valid URL, check if it's just a token
       if (/^[A-Za-z0-9]{8}$/.test(url)) {
         return url;
       }
     }
     return null;
   };
 
   // Start scanner when modal opens
   useEffect(() => {
     if (isOpen && !storyPreview) {
       startScanner();
     }
     return () => {
       stopScanner();
     };
   }, [isOpen]);
 
   const startScanner = async () => {
     setIsScanning(true);
     setError(null);
     setIsExpired(false);
 
     try {
       // Wait for container to be in DOM
       await new Promise((resolve) => setTimeout(resolve, 100));
 
       const html5QrCode = new Html5Qrcode(scannerContainerId);
       scannerRef.current = html5QrCode;
 
       await html5QrCode.start(
         { facingMode: "environment" },
         { fps: 10, qrbox: { width: 250, height: 250 } },
         async (decodedText) => {
           await stopScanner();
           await handleScan(decodedText);
         },
         () => {} // Ignore scan failures
       );
     } catch (err) {
       console.error("Scanner error:", err);
       setError(t.cameraError);
       setIsScanning(false);
     }
   };
 
   const stopScanner = async () => {
     if (scannerRef.current) {
       try {
         await scannerRef.current.stop();
         scannerRef.current.clear();
       } catch {
         // Ignore stop errors
       }
       scannerRef.current = null;
     }
     setIsScanning(false);
   };
 
   const handleScan = async (scannedText: string) => {
     const token = extractToken(scannedText);
     if (!token) {
       setError(t.notFound);
       return;
     }
 
     setShareToken(token);
     setIsLoading(true);
     setError(null);
 
     try {
       const { data, error: fetchError } = await supabase.functions.invoke("get-share", {
         body: {},
         method: "GET",
       });
 
       // Since we can't pass query params directly, use fetch
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-share?token=${token}`,
         {
           headers: {
             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
         }
       );
 
       const responseData = await response.json();
 
       if (!response.ok) {
         if (responseData.expired) {
           setIsExpired(true);
           setError(t.expired);
         } else {
           setError(t.notFound);
         }
         return;
       }
 
       setStoryPreview(responseData);
     } catch (err) {
       console.error("Fetch error:", err);
       setError(t.error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleImport = async () => {
     if (!user?.id || !shareToken) return;
 
     setIsImporting(true);
     try {
       const { data, error } = await supabase.functions.invoke("import-story", {
         body: {
           share_token: shareToken,
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
       onImportSuccess?.(data.story_id);
     } catch (err) {
       console.error("Import error:", err);
       toast.error(t.error);
     } finally {
       setIsImporting(false);
     }
   };
 
   const handleClose = () => {
     stopScanner();
     setStoryPreview(null);
     setShareToken(null);
     setError(null);
     setIsExpired(false);
     onClose();
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="text-xl font-baloo">{t.title}</DialogTitle>
         </DialogHeader>
 
         {/* Scanner View */}
         {!storyPreview && !error && (
           <div className="relative">
             <div
               id={scannerContainerId}
               className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
             />
             {isScanning && (
               <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <span className="ml-2 text-sm">{t.scanning}</span>
               </div>
             )}
           </div>
         )}
 
         {/* Loading State */}
         {isLoading && (
           <div className="flex flex-col items-center py-8">
             <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
           </div>
         )}
 
         {/* Error State */}
         {error && (
           <div className="flex flex-col items-center py-6 text-center">
             <div className={`p-4 rounded-full mb-4 ${isExpired ? "bg-amber-100" : "bg-destructive/10"}`}>
               <AlertCircle className={`h-10 w-10 ${isExpired ? "text-amber-600" : "text-destructive"}`} />
             </div>
             <p className="text-muted-foreground">{error}</p>
             <Button variant="outline" onClick={handleClose} className="mt-4">
               {t.cancel}
             </Button>
           </div>
         )}
 
         {/* Preview State */}
         {storyPreview && !error && (
           <ImportPreview
             story={storyPreview}
             language={language}
             isImporting={isImporting}
             onImport={handleImport}
             onCancel={handleClose}
           />
         )}
       </DialogContent>
     </Dialog>
   );
 }