 import { Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Language } from "@/lib/translations";
 
 /**
  * Preview component for a shared story before import.
  * Shows title, first paragraph, and import/cancel buttons.
  * 
  * @param story - The shared story data to preview
  * @param language - Current app language for translations
  * @param isImporting - Whether import is in progress
  * @param onImport - Callback to trigger import
  * @param onCancel - Callback to cancel and close
  */
 interface ImportPreviewProps {
   story: {
     title: string;
     content: string;
     difficulty?: string;
     text_language?: string;
     cover_image_url?: string;
   };
   language: Language;
   isImporting: boolean;
   onImport: () => void;
   onCancel: () => void;
 }
 
 const translations: Record<Language, {
   addToLibrary: string;
   adding: string;
   cancel: string;
   preview: string;
 }> = {
   de: { addToLibrary: "Zu meiner Bibliothek hinzufügen", adding: "Wird hinzugefügt...", cancel: "Abbrechen", preview: "Vorschau" },
   fr: { addToLibrary: "Ajouter à ma bibliothèque", adding: "Ajout en cours...", cancel: "Annuler", preview: "Aperçu" },
   en: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
   es: { addToLibrary: "Añadir a mi biblioteca", adding: "Añadiendo...", cancel: "Cancelar", preview: "Vista previa" },
   nl: { addToLibrary: "Toevoegen aan bibliotheek", adding: "Toevoegen...", cancel: "Annuleren", preview: "Voorbeeld" },
  it: { addToLibrary: "Aggiungi alla mia libreria", adding: "Aggiunta...", cancel: "Annulla", preview: "Anteprima" },
  bs: { addToLibrary: "Dodaj u moju biblioteku", adding: "Dodavanje...", cancel: "Otkaži", preview: "Pregled" },
  pt: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  sk: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  bg: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  ca: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  hu: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  lt: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  pl: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  ro: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  sl: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  tr: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  ru: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
  uk: { addToLibrary: "Add to my library", adding: "Adding...", cancel: "Cancel", preview: "Preview" },
 };
 
 export default function ImportPreview({
   story,
   language,
   isImporting,
   onImport,
   onCancel,
 }: ImportPreviewProps) {
   const t = translations[language] || translations.de;
 
   // Get first paragraph for preview
   const firstParagraph = story.content.split("\n\n")[0]?.slice(0, 200) || "";
 
   return (
     <div className="flex flex-col gap-4">
       {/* Cover image if available */}
       {story.cover_image_url && (
         <div className="w-full h-40 rounded-lg overflow-hidden">
           <img
             src={story.cover_image_url}
             alt={story.title}
             className="w-full h-full object-cover"
           />
         </div>
       )}
 
       {/* Story title */}
       <h3 className="text-xl font-baloo font-bold text-foreground">
         {story.title}
       </h3>
 
       {/* Preview text */}
       <div className="bg-muted/50 rounded-lg p-4">
         <p className="text-sm text-muted-foreground italic mb-1">{t.preview}:</p>
         <p className="text-sm text-foreground line-clamp-4">
           {firstParagraph}...
         </p>
       </div>
 
       {/* Action buttons */}
       <div className="flex gap-3 mt-2">
         <Button
           variant="outline"
           onClick={onCancel}
           disabled={isImporting}
           className="flex-1"
         >
           {t.cancel}
         </Button>
         <Button
           onClick={onImport}
           disabled={isImporting}
           className="flex-1 gap-2"
         >
           {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
           {isImporting ? t.adding : t.addToLibrary}
         </Button>
       </div>
     </div>
   );
 }