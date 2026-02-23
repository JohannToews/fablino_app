 import { useState } from "react";
 import { QrCode } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import QRScannerModal from "./QRScannerModal";
 import { Language } from "@/lib/translations";
 
 /**
  * Button that opens a QR scanner to import shared stories.
  * 
  * @param language - Current app language for translations
  * @param onImportSuccess - Callback when a story is successfully imported
  */
 interface ScanStoryButtonProps {
   language: Language;
   onImportSuccess?: (storyId: string) => void;
 }
 
 const translations: Record<Language, { scan: string }> = {
   de: { scan: "Geschichte scannen" },
   fr: { scan: "Scanner une histoire" },
   en: { scan: "Scan Story" },
   es: { scan: "Escanear historia" },
   nl: { scan: "Verhaal scannen" },
   it: { scan: "Scansiona storia" },
   bs: { scan: "Skeniraj priču" },
   pt: { scan: "Scan Story" },
   sk: { scan: "Scan Story" },
   bg: { scan: "Scan Story" },
   ca: { scan: "Scan Story" },
   hu: { scan: "Scan Story" },
   lt: { scan: "Scan Story" },
   pl: { scan: "Scan Story" },
   ro: { scan: "Scan Story" },
   sl: { scan: "Scan Story" },
   tr: { scan: "Scan Story" },
 };

 export default function ScanStoryButton({ language, onImportSuccess }: ScanStoryButtonProps) {
   const [showScanner, setShowScanner] = useState(false);
   const t = translations[language] || translations.de;
 
   return (
     <>
       <Button
         variant="outline"
         onClick={() => setShowScanner(true)}
         className="gap-2"
       >
         <QrCode className="h-5 w-5" />
         {t.scan}
       </Button>
 
       <QRScannerModal
         isOpen={showScanner}
         onClose={() => setShowScanner(false)}
         language={language}
         onImportSuccess={(storyId) => {
           setShowScanner(false);
           onImportSuccess?.(storyId);
         }}
       />
     </>
   );
 }