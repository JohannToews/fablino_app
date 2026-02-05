 import { QRCodeSVG } from "qrcode.react";
 import { X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Language } from "@/lib/translations";
 
 /**
  * Fullscreen modal displaying a QR code for story sharing.
  * The QR code contains a URL with the share token.
  * 
  * @param isOpen - Whether the modal is visible
  * @param onClose - Callback to close the modal
  * @param shareToken - The 8-character share token
  * @param expiresAt - ISO timestamp when the share expires
  * @param language - Current app language for translations
  */
 interface QRCodeModalProps {
   isOpen: boolean;
   onClose: () => void;
   shareToken: string;
   expiresAt: string;
   language: Language;
 }
 
 const translations: Record<Language, {
   title: string;
   validUntil: string;
   close: string;
   scanInfo: string;
 }> = {
   de: {
     title: "Geschichte teilen",
     validUntil: "Gültig bis",
     close: "Schließen",
     scanInfo: "Scanne diesen QR-Code, um die Geschichte zu erhalten",
   },
   fr: {
     title: "Partager l'histoire",
     validUntil: "Valide jusqu'au",
     close: "Fermer",
     scanInfo: "Scannez ce QR code pour recevoir l'histoire",
   },
   en: {
     title: "Share Story",
     validUntil: "Valid until",
     close: "Close",
     scanInfo: "Scan this QR code to receive the story",
   },
   es: {
     title: "Compartir historia",
     validUntil: "Válido hasta",
     close: "Cerrar",
     scanInfo: "Escanea este código QR para recibir la historia",
   },
   nl: {
     title: "Verhaal delen",
     validUntil: "Geldig tot",
     close: "Sluiten",
     scanInfo: "Scan deze QR-code om het verhaal te ontvangen",
   },
   it: {
     title: "Condividi storia",
     validUntil: "Valido fino al",
     close: "Chiudi",
     scanInfo: "Scansiona questo codice QR per ricevere la storia",
   },
   bs: {
     title: "Podijeli priču",
     validUntil: "Vrijedi do",
     close: "Zatvori",
     scanInfo: "Skeniraj ovaj QR kod da dobiješ priču",
   },
 };
 
 export default function QRCodeModal({
   isOpen,
   onClose,
   shareToken,
   expiresAt,
   language,
 }: QRCodeModalProps) {
   const t = translations[language] || translations.de;
   
   // Format expiry date for display
   const expiryDate = new Date(expiresAt);
  const formattedExpiry = expiryDate.toLocaleString(language, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Always use the published URL for sharing (not preview URL)
  // This ensures other users land on the public app, not Lovable login
  const PUBLISHED_URL = "https://kinder-wort-trainer.lovable.app";
  const shareUrl = `${PUBLISHED_URL}/s/${shareToken}`;
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <DialogContent className="sm:max-w-md flex flex-col items-center p-8">
         <DialogHeader className="text-center">
           <DialogTitle className="text-2xl font-baloo">{t.title}</DialogTitle>
         </DialogHeader>
 
         <div className="bg-white p-4 rounded-xl shadow-lg my-6">
           <QRCodeSVG
             value={shareUrl}
             size={250}
             level="M"
             includeMargin
             className="w-full h-auto"
           />
         </div>
 
         <p className="text-sm text-muted-foreground text-center mb-2">
           {t.scanInfo}
         </p>
 
         <p className="text-sm font-medium text-center text-primary">
           {t.validUntil}: {formattedExpiry}
         </p>
 
         <Button onClick={onClose} className="mt-6 w-full" size="lg">
           {t.close}
         </Button>
       </DialogContent>
     </Dialog>
   );
 }