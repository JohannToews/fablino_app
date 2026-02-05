import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import { X, AlertCircle, Loader2, SwitchCamera } from "lucide-react";
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
  switchCamera: string;
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
    switchCamera: "Kamera wechseln",
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
    switchCamera: "Changer de caméra",
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
    switchCamera: "Switch camera",
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
    switchCamera: "Cambiar cámara",
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
    switchCamera: "Wissel camera",
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
    switchCamera: "Cambia fotocamera",
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
    switchCamera: "Promijeni kameru",
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
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

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
      initializeScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    setIsScanning(true);
    setError(null);
    setIsExpired(false);

    try {
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);

      if (devices.length === 0) {
        setError(t.cameraError);
        setIsScanning(false);
        return;
      }

      // Try to find back camera first (usually contains "back", "rear", or "environment" in label)
      let backCameraIndex = devices.findIndex(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment") ||
          d.label.toLowerCase().includes("rück")
      );

      // If no back camera found by label, use the last camera (often back camera on mobile)
      if (backCameraIndex === -1 && devices.length > 1) {
        backCameraIndex = devices.length - 1;
      } else if (backCameraIndex === -1) {
        backCameraIndex = 0;
      }

      setCurrentCameraIndex(backCameraIndex);
      await startScannerWithCamera(devices[backCameraIndex].id);
    } catch (err) {
      console.error("Scanner init error:", err);
      setError(t.cameraError);
      setIsScanning(false);
    }
  };

  const startScannerWithCamera = async (cameraId: string) => {
    try {
      // Wait for container to be in DOM
      await new Promise((resolve) => setTimeout(resolve, 200));

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        verbose: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      scannerRef.current = html5QrCode;

      console.log("Starting scanner with camera:", cameraId);

      await html5QrCode.start(
        cameraId,
        { 
          fps: 15, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Use 70% of the smallest dimension for the scan box
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minDimension * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          // Vibrate on successful scan if supported
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          await stopScanner();
          await handleScan(decodedText);
        },
        (errorMessage) => {
          // Only log significant errors, not every frame
          if (!errorMessage.includes("No MultiFormat Readers")) {
            console.log("Scan frame:", errorMessage);
          }
        }
      );
      
      setIsScanning(false);
      console.log("Scanner started successfully");
    } catch (err) {
      console.error("Scanner start error:", err);
      setError(t.cameraError);
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    await stopScanner();
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    setIsScanning(true);
    
    await startScannerWithCamera(cameras[nextIndex].id);
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
    setCameras([]);
    setCurrentCameraIndex(0);
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
            
            {/* Camera Switch Button */}
            {cameras.length > 1 && !isScanning && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-3 right-3 rounded-full shadow-lg"
                onClick={switchCamera}
                title={t.switchCamera}
              >
                <SwitchCamera className="h-5 w-5" />
              </Button>
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
