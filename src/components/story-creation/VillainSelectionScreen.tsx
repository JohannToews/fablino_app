import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useAuth } from "@/hooks/useAuth";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import VoiceRecordButton from "./VoiceRecordButton";
import type { SelectedCharacter, VillainData } from "./types";

// Translations for the villain screen
const villainTranslations: Record<string, {
  header: string;
  fromCharacters: string;
  markAsVillain: string;
  newVillain: string;
  describePlaceholder: string;
  addButton: string;
  savedVillains: string;
  continue: string;
  back: string;
  nameRequired: string;
}> = {
  de: { header: "Wer ist der Bösewicht?", fromCharacters: "Aus deinen Charakteren", markAsVillain: "😈 Ist der Bösewicht", newVillain: "Neuer Bösewicht", describePlaceholder: "Beschreibe deinen Bösewicht (Name, Kräfte...)", addButton: "Hinzufügen", savedVillains: "Frühere Bösewichte", continue: "Weiter", back: "Zurück", nameRequired: "Name eingeben" },
  fr: { header: "Qui est le méchant ?", fromCharacters: "Parmi tes personnages", markAsVillain: "😈 C'est le méchant", newVillain: "Nouveau méchant", describePlaceholder: "Décris ton méchant (nom, pouvoirs...)", addButton: "Ajouter", savedVillains: "Méchants précédents", continue: "Continuer", back: "Retour", nameRequired: "Entre un nom" },
  en: { header: "Who is the villain?", fromCharacters: "From your characters", markAsVillain: "😈 Is the villain", newVillain: "New villain", describePlaceholder: "Describe your villain (name, powers...)", addButton: "Add", savedVillains: "Previous villains", continue: "Continue", back: "Back", nameRequired: "Enter a name" },
  es: { header: "¿Quién es el villano?", fromCharacters: "De tus personajes", markAsVillain: "😈 Es el villano", newVillain: "Nuevo villano", describePlaceholder: "Describe a tu villano (nombre, poderes...)", addButton: "Añadir", savedVillains: "Villanos anteriores", continue: "Continuar", back: "Atrás", nameRequired: "Introduce un nombre" },
  nl: { header: "Wie is de schurk?", fromCharacters: "Uit je personages", markAsVillain: "😈 Is de schurk", newVillain: "Nieuwe schurk", describePlaceholder: "Beschrijf je schurk (naam, krachten...)", addButton: "Toevoegen", savedVillains: "Eerdere schurken", continue: "Verder", back: "Terug", nameRequired: "Voer een naam in" },
  it: { header: "Chi è il cattivo?", fromCharacters: "Dai tuoi personaggi", markAsVillain: "😈 È il cattivo", newVillain: "Nuovo cattivo", describePlaceholder: "Descrivi il tuo cattivo (nome, poteri...)", addButton: "Aggiungi", savedVillains: "Cattivi precedenti", continue: "Continua", back: "Indietro", nameRequired: "Inserisci un nome" },
  bs: { header: "Ko je zlikovac?", fromCharacters: "Iz tvojih likova", markAsVillain: "😈 On je zlikovac", newVillain: "Novi zlikovac", describePlaceholder: "Opiši svog zlikovca (ime, moći...)", addButton: "Dodaj", savedVillains: "Raniji zlikovci", continue: "Nastavi", back: "Nazad", nameRequired: "Unesi ime" },
  tr: { header: "Kötü kim?", fromCharacters: "Karakterlerinden", markAsVillain: "😈 O kötü", newVillain: "Yeni kötü", describePlaceholder: "Kötünü anlat (isim, güçler...)", addButton: "Ekle", savedVillains: "Önceki kötüler", continue: "Devam", back: "Geri", nameRequired: "İsim gir" },
  bg: { header: "Кой е злодеят?", fromCharacters: "От твоите герои", markAsVillain: "😈 Той е злодеят", newVillain: "Нов злодей", describePlaceholder: "Опиши злодея си (име, сили...)", addButton: "Добави", savedVillains: "Предишни злодеи", continue: "Продължи", back: "Назад", nameRequired: "Въведи име" },
  ro: { header: "Cine este răufăcătorul?", fromCharacters: "Din personajele tale", markAsVillain: "😈 E răufăcătorul", newVillain: "Răufăcător nou", describePlaceholder: "Descrie-ți răufăcătorul (nume, puteri...)", addButton: "Adaugă", savedVillains: "Răufăcători anteriori", continue: "Continuă", back: "Înapoi", nameRequired: "Introdu un nume" },
  pl: { header: "Kto jest złoczyńcą?", fromCharacters: "Z twoich postaci", markAsVillain: "😈 To złoczyńca", newVillain: "Nowy złoczyńca", describePlaceholder: "Opisz złoczyńcę (imię, moce...)", addButton: "Dodaj", savedVillains: "Wcześniejsi złoczyńcy", continue: "Dalej", back: "Wstecz", nameRequired: "Wpisz imię" },
  lt: { header: "Kas yra piktadarys?", fromCharacters: "Iš tavo personažų", markAsVillain: "😈 Tai piktadarys", newVillain: "Naujas piktadarys", describePlaceholder: "Aprašyk piktadarį (vardas, galios...)", addButton: "Pridėti", savedVillains: "Ankstesni piktadariai", continue: "Tęsti", back: "Atgal", nameRequired: "Įvesk vardą" },
  hu: { header: "Ki a gonosz?", fromCharacters: "A karaktereidből", markAsVillain: "😈 Ő a gonosz", newVillain: "Új gonosz", describePlaceholder: "Írd le a gonoszt (név, képességek...)", addButton: "Hozzáadás", savedVillains: "Korábbi gonoszok", continue: "Tovább", back: "Vissza", nameRequired: "Adj meg egy nevet" },
  ca: { header: "Qui és el malvat?", fromCharacters: "Dels teus personatges", markAsVillain: "😈 És el malvat", newVillain: "Nou malvat", describePlaceholder: "Descriu el teu malvat (nom, poders...)", addButton: "Afegir", savedVillains: "Malvats anteriors", continue: "Continua", back: "Enrere", nameRequired: "Introdueix un nom" },
  sl: { header: "Kdo je zlikovec?", fromCharacters: "Iz tvojih likov", markAsVillain: "😈 On je zlikovec", newVillain: "Nov zlikovec", describePlaceholder: "Opiši zlikovca (ime, moči...)", addButton: "Dodaj", savedVillains: "Prejšnji zlikovci", continue: "Nadaljuj", back: "Nazaj", nameRequired: "Vnesi ime" },
  uk: { header: "Хто лиходій?", fromCharacters: "З твоїх персонажів", markAsVillain: "😈 Це лиходій", newVillain: "Новий лиходій", describePlaceholder: "Опиши лиходія (ім'я, сили...)", addButton: "Додати", savedVillains: "Попередні лиходії", continue: "Далі", back: "Назад", nameRequired: "Введи ім'я" },
  ru: { header: "Кто злодей?", fromCharacters: "Из твоих персонажей", markAsVillain: "😈 Это злодей", newVillain: "Новый злодей", describePlaceholder: "Опиши злодея (имя, способности...)", addButton: "Добавить", savedVillains: "Предыдущие злодеи", continue: "Далее", back: "Назад", nameRequired: "Введи имя" },
  pt: { header: "Quem é o vilão?", fromCharacters: "Dos teus personagens", markAsVillain: "😈 É o vilão", newVillain: "Novo vilão", describePlaceholder: "Descreve o vilão (nome, poderes...)", addButton: "Adicionar", savedVillains: "Vilões anteriores", continue: "Continuar", back: "Voltar", nameRequired: "Insere um nome" },
  sk: { header: "Kto je zloduch?", fromCharacters: "Z tvojich postáv", markAsVillain: "😈 To je zloduch", newVillain: "Nový zloduch", describePlaceholder: "Opíš zlodeja (meno, schopnosti...)", addButton: "Pridať", savedVillains: "Predchádzajúci zloduchy", continue: "Ďalej", back: "Späť", nameRequired: "Zadaj meno" },
};

interface VillainSelectionScreenProps {
  selectedCharacters: SelectedCharacter[];
  onComplete: (villain: VillainData) => void;
  onBack: () => void;
}

const VillainSelectionScreen = ({ selectedCharacters, onComplete, onBack }: VillainSelectionScreenProps) => {
  const { kidAppLanguage, kidReadingLanguage, selectedProfile } = useKidProfile();
  const { user } = useAuth();
  const t = villainTranslations[kidAppLanguage] || villainTranslations.de;

  // State
  const [selectedCharacterVillain, setSelectedCharacterVillain] = useState<string | null>(null);
  const [newVillainText, setNewVillainText] = useState("");
  const [savedVillains, setSavedVillains] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [selectedSavedVillain, setSelectedSavedVillain] = useState<string | null>(null);

  // Load saved villains from kid_characters with role="villain"
  useEffect(() => {
    if (!selectedProfile?.id) return;
    const loadVillains = async () => {
      const { data } = await supabase
        .from("kid_characters")
        .select("id, name, description")
        .eq("kid_profile_id", selectedProfile.id)
        .eq("role", "villain")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) setSavedVillains(data);
    };
    loadVillains();
  }, [selectedProfile?.id]);

  // Determine the active villain source
  const villainSource: "character" | "new" | "saved" | null =
    selectedCharacterVillain ? "character" :
    selectedSavedVillain ? "saved" :
    null;

  const handleSelectCharacterVillain = (charId: string) => {
    setSelectedCharacterVillain(prev => prev === charId ? null : charId);
    setSelectedSavedVillain(null);
  };

  const handleSelectSavedVillain = (id: string) => {
    setSelectedSavedVillain(prev => prev === id ? null : id);
    setSelectedCharacterVillain(null);
  };

  const handleAddNewVillain = async () => {
    const trimmed = newVillainText.trim();
    if (!trimmed || !selectedProfile?.id) return;

    // Parse name: first word is name, rest is description
    const parts = trimmed.split(/\s+/);
    const name = parts[0];
    const description = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

    // Save to kid_characters
    const { data, error } = await supabase
      .from("kid_characters")
      .insert({
        kid_profile_id: selectedProfile.id,
        name,
        role: "villain",
        description: description || null,
        is_active: true,
      })
      .select("id, name, description")
      .single();

    if (!error && data) {
      setSavedVillains(prev => [data, ...prev]);
      setSelectedSavedVillain(data.id);
      setSelectedCharacterVillain(null);
      setNewVillainText("");
    }
  };

  const handleContinue = () => {
    if (selectedCharacterVillain) {
      const char = selectedCharacters.find(c => c.id === selectedCharacterVillain);
      if (char) {
        onComplete({
          name: char.name,
          role: "villain",
          description: char.description,
          type: "family",
        });
      }
    } else if (selectedSavedVillain) {
      const saved = savedVillains.find(v => v.id === selectedSavedVillain);
      if (saved) {
        onComplete({
          name: saved.name,
          role: "villain",
          description: saved.description,
          type: "special",
        });
      }
    }
  };

  const canContinue = selectedCharacterVillain || selectedSavedVillain;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FFF8F0]">
      <div className="flex-1 flex flex-col items-stretch px-4 max-w-[600px] mx-auto w-full gap-4 pb-24">
        <FablinoPageHeader
          mascotImage="/mascot/5_new_story.png"
          message={t.header}
          mascotSize="sm"
          showBackButton
          onBack={onBack}
        />

        {/* Section 1: From existing characters */}
        {selectedCharacters.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#92400E] mb-2">{t.fromCharacters}</h3>
            <div className="space-y-2">
              {selectedCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleSelectCharacterVillain(char.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-150",
                    selectedCharacterVillain === char.id
                      ? "border-red-400 bg-red-50 shadow-sm"
                      : "border-orange-100 bg-white hover:border-orange-200"
                  )}
                >
                  <span className="text-sm font-medium text-[#2D1810]">{char.name}</span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full transition-colors",
                    selectedCharacterVillain === char.id
                      ? "bg-red-400 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {selectedCharacterVillain === char.id ? t.markAsVillain : "😈"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: New villain */}
        <div>
          <h3 className="text-sm font-semibold text-[#92400E] mb-2">{t.newVillain}</h3>
          <div className="relative">
            <Textarea
              value={newVillainText}
              onChange={(e) => setNewVillainText(e.target.value)}
              placeholder={t.describePlaceholder}
              maxLength={200}
              className="min-h-[48px] max-h-[100px] text-base resize-none rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 pr-14 bg-white"
              style={{ fontSize: '16px' }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceRecordButton
                language={kidReadingLanguage || 'de'}
                onTranscript={(text) => {
                  setNewVillainText(prev => {
                    const next = prev ? `${prev} ${text}` : text;
                    return next.slice(0, 200);
                  });
                }}
                className="!gap-1"
              />
            </div>
          </div>
          {newVillainText.trim().length > 0 && (
            <button
              onClick={handleAddNewVillain}
              className="mt-2 px-4 py-2 rounded-xl bg-[#E8863A] text-white text-sm font-semibold hover:bg-[#D4752E] transition-colors active:scale-[0.98]"
            >
              + {t.addButton}
            </button>
          )}
        </div>

        {/* Section 3: Saved villains */}
        {savedVillains.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#92400E] mb-2">{t.savedVillains}</h3>
            <div className="flex flex-wrap gap-2">
              {savedVillains.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectSavedVillain(v.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-150",
                    selectedSavedVillain === v.id
                      ? "border-red-400 bg-red-50 text-red-700 shadow-sm"
                      : "border-orange-100 bg-white text-[#2D1810] hover:border-orange-200"
                  )}
                >
                  😈 {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Continue button — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="max-w-[600px] mx-auto px-4 pt-3 pb-3 bg-gradient-to-t from-[#FFF8F0] via-[#FFF8F0]/95 to-transparent">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            data-premium-button="primary"
            className={cn(
              "w-full min-h-[56px] rounded-2xl text-lg font-semibold transition-colors shadow-lg active:scale-[0.98]",
              canContinue
                ? "bg-[#E8863A] hover:bg-[#D4752E] text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {t.continue} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VillainSelectionScreen;
