import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useKidProfile } from "@/hooks/useKidProfile";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import VoiceRecordButton from "./VoiceRecordButton";
import type { SelectedCharacter, VillainData } from "./types";

const villainTranslations: Record<string, {
  header: string;
  tabCharacter: string;
  tabNew: string;
  pickCharacter: string;
  markAsVillain: string;
  describePlaceholder: string;
  addButton: string;
  savedVillains: string;
  orSaved: string;
  continue: string;
  back: string;
}> = {
  de: { header: "Wer ist der Bösewicht? 😈", tabCharacter: "Einer deiner Helden", tabNew: "Neuer Bösewicht", pickCharacter: "Wähle einen aus:", markAsVillain: "😈 Bösewicht!", describePlaceholder: "Name und Beschreibung (z.B. Steinmonster mit Feuerkraft)", addButton: "Hinzufügen", savedVillains: "Oder ein früherer", orSaved: "Oder wähle einen früheren:", continue: "Weiter", back: "Zurück" },
  fr: { header: "Qui est le méchant ? 😈", tabCharacter: "Un de tes héros", tabNew: "Nouveau méchant", pickCharacter: "Choisis-en un :", markAsVillain: "😈 Méchant !", describePlaceholder: "Nom et description (ex. monstre de pierre avec pouvoir de feu)", addButton: "Ajouter", savedVillains: "Ou un précédent", orSaved: "Ou choisis un précédent :", continue: "Continuer", back: "Retour" },
  en: { header: "Who is the villain? 😈", tabCharacter: "One of your heroes", tabNew: "New villain", pickCharacter: "Pick one:", markAsVillain: "😈 Villain!", describePlaceholder: "Name and description (e.g. stone monster with fire power)", addButton: "Add", savedVillains: "Or a previous one", orSaved: "Or pick a previous one:", continue: "Continue", back: "Back" },
  es: { header: "¿Quién es el villano? 😈", tabCharacter: "Uno de tus héroes", tabNew: "Nuevo villano", pickCharacter: "Elige uno:", markAsVillain: "😈 ¡Villano!", describePlaceholder: "Nombre y descripción (ej. monstruo de piedra con poder de fuego)", addButton: "Añadir", savedVillains: "O uno anterior", orSaved: "O elige uno anterior:", continue: "Continuar", back: "Atrás" },
  nl: { header: "Wie is de schurk? 😈", tabCharacter: "Een van je helden", tabNew: "Nieuwe schurk", pickCharacter: "Kies er een:", markAsVillain: "😈 Schurk!", describePlaceholder: "Naam en beschrijving (bv. steenmonster met vuurrracht)", addButton: "Toevoegen", savedVillains: "Of een eerdere", orSaved: "Of kies een eerdere:", continue: "Verder", back: "Terug" },
  it: { header: "Chi è il cattivo? 😈", tabCharacter: "Uno dei tuoi eroi", tabNew: "Nuovo cattivo", pickCharacter: "Scegline uno:", markAsVillain: "😈 Cattivo!", describePlaceholder: "Nome e descrizione (es. mostro di pietra con potere di fuoco)", addButton: "Aggiungi", savedVillains: "O uno precedente", orSaved: "O scegli uno precedente:", continue: "Continua", back: "Indietro" },
  bs: { header: "Ko je zlikovac? 😈", tabCharacter: "Jedan od tvojih heroja", tabNew: "Novi zlikovac", pickCharacter: "Izaberi jednog:", markAsVillain: "😈 Zlikovac!", describePlaceholder: "Ime i opis (npr. kameni čudovište sa vatrenom moći)", addButton: "Dodaj", savedVillains: "Ili raniji", orSaved: "Ili izaberi ranijeg:", continue: "Nastavi", back: "Nazad" },
  tr: { header: "Kötü kim? 😈", tabCharacter: "Kahramanlarından biri", tabNew: "Yeni kötü", pickCharacter: "Birini seç:", markAsVillain: "😈 Kötü!", describePlaceholder: "İsim ve açıklama (ör. ateş gücüne sahip taş canavar)", addButton: "Ekle", savedVillains: "Veya önceki", orSaved: "Veya önceki birini seç:", continue: "Devam", back: "Geri" },
  bg: { header: "Кой е злодеят? 😈", tabCharacter: "Един от героите ти", tabNew: "Нов злодей", pickCharacter: "Избери един:", markAsVillain: "😈 Злодей!", describePlaceholder: "Име и описание (напр. каменно чудовище с огнена сила)", addButton: "Добави", savedVillains: "Или предишен", orSaved: "Или избери предишен:", continue: "Продължи", back: "Назад" },
  ro: { header: "Cine e răufăcătorul? 😈", tabCharacter: "Unul din eroii tăi", tabNew: "Răufăcător nou", pickCharacter: "Alege-l:", markAsVillain: "😈 Răufăcător!", describePlaceholder: "Nume și descriere (ex. monstru de piatră cu putere de foc)", addButton: "Adaugă", savedVillains: "Sau unul anterior", orSaved: "Sau alege unul anterior:", continue: "Continuă", back: "Înapoi" },
  pl: { header: "Kto jest złoczyńcą? 😈", tabCharacter: "Jeden z twoich bohaterów", tabNew: "Nowy złoczyńca", pickCharacter: "Wybierz jednego:", markAsVillain: "😈 Złoczyńca!", describePlaceholder: "Imię i opis (np. kamienny potwór z mocą ognia)", addButton: "Dodaj", savedVillains: "Lub wcześniejszy", orSaved: "Lub wybierz wcześniejszego:", continue: "Dalej", back: "Wstecz" },
  lt: { header: "Kas yra piktadarys? 😈", tabCharacter: "Vienas iš tavo herojų", tabNew: "Naujas piktadarys", pickCharacter: "Pasirink vieną:", markAsVillain: "😈 Piktadarys!", describePlaceholder: "Vardas ir aprašymas (pvz. akmeninis monstras su ugnies galia)", addButton: "Pridėti", savedVillains: "Arba ankstesnis", orSaved: "Arba pasirink ankstesnį:", continue: "Tęsti", back: "Atgal" },
  hu: { header: "Ki a gonosz? 😈", tabCharacter: "Egyik hősöd", tabNew: "Új gonosz", pickCharacter: "Válassz egyet:", markAsVillain: "😈 Gonosz!", describePlaceholder: "Név és leírás (pl. kőszörny tűzerővel)", addButton: "Hozzáadás", savedVillains: "Vagy korábbi", orSaved: "Vagy válassz korábbit:", continue: "Tovább", back: "Vissza" },
  ca: { header: "Qui és el malvat? 😈", tabCharacter: "Un dels teus herois", tabNew: "Nou malvat", pickCharacter: "Tria'n un:", markAsVillain: "😈 Malvat!", describePlaceholder: "Nom i descripció (ex. monstre de pedra amb poder de foc)", addButton: "Afegir", savedVillains: "O un anterior", orSaved: "O tria un anterior:", continue: "Continua", back: "Enrere" },
  sl: { header: "Kdo je zlikovec? 😈", tabCharacter: "Eden od tvojih junakov", tabNew: "Nov zlikovec", pickCharacter: "Izberi enega:", markAsVillain: "😈 Zlikovec!", describePlaceholder: "Ime in opis (npr. kamnito pošast z ognjem)", addButton: "Dodaj", savedVillains: "Ali prejšnji", orSaved: "Ali izberi prejšnjega:", continue: "Nadaljuj", back: "Nazaj" },
  uk: { header: "Хто лиходій? 😈", tabCharacter: "Один з твоїх героїв", tabNew: "Новий лиходій", pickCharacter: "Обери одного:", markAsVillain: "😈 Лиходій!", describePlaceholder: "Ім'я та опис (напр. кам'яний монстр з вогняною силою)", addButton: "Додати", savedVillains: "Або попередній", orSaved: "Або обери попереднього:", continue: "Далі", back: "Назад" },
  ru: { header: "Кто злодей? 😈", tabCharacter: "Один из твоих героев", tabNew: "Новый злодей", pickCharacter: "Выбери одного:", markAsVillain: "😈 Злодей!", describePlaceholder: "Имя и описание (напр. каменный монстр с силой огня)", addButton: "Добавить", savedVillains: "Или предыдущий", orSaved: "Или выбери предыдущего:", continue: "Далее", back: "Назад" },
  pt: { header: "Quem é o vilão? 😈", tabCharacter: "Um dos teus heróis", tabNew: "Novo vilão", pickCharacter: "Escolhe um:", markAsVillain: "😈 Vilão!", describePlaceholder: "Nome e descrição (ex. monstro de pedra com poder de fogo)", addButton: "Adicionar", savedVillains: "Ou um anterior", orSaved: "Ou escolhe um anterior:", continue: "Continuar", back: "Voltar" },
  sk: { header: "Kto je zloduch? 😈", tabCharacter: "Jeden z tvojich hrdinov", tabNew: "Nový zloduch", pickCharacter: "Vyber jedného:", markAsVillain: "😈 Zloduch!", describePlaceholder: "Meno a popis (napr. kamenná príšera s ohňovou silou)", addButton: "Pridať", savedVillains: "Alebo predchádzajúci", orSaved: "Alebo vyber predchádzajúceho:", continue: "Ďalej", back: "Späť" },
};

type VillainTab = "character" | "new";

interface VillainSelectionScreenProps {
  selectedCharacters: SelectedCharacter[];
  onComplete: (villain: VillainData) => void;
  onBack: () => void;
}

const VillainSelectionScreen = ({ selectedCharacters, onComplete, onBack }: VillainSelectionScreenProps) => {
  const { kidAppLanguage, kidReadingLanguage, selectedProfile } = useKidProfile();
  const t = villainTranslations[kidAppLanguage] || villainTranslations.de;

  const hasCharacters = selectedCharacters.length > 0;
  const [activeTab, setActiveTab] = useState<VillainTab>(hasCharacters ? "character" : "new");
  const [selectedCharacterVillain, setSelectedCharacterVillain] = useState<string | null>(null);
  const [newVillainText, setNewVillainText] = useState("");
  const [savedVillains, setSavedVillains] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [selectedSavedVillain, setSelectedSavedVillain] = useState<string | null>(null);

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

  // Clear other tab's selection when switching
  const handleTabSwitch = (tab: VillainTab) => {
    setActiveTab(tab);
    if (tab === "character") {
      setSelectedSavedVillain(null);
    } else {
      setSelectedCharacterVillain(null);
    }
  };

  const handleSelectCharacterVillain = (charId: string) => {
    setSelectedCharacterVillain(prev => prev === charId ? null : charId);
  };

  const handleSelectSavedVillain = (id: string) => {
    setSelectedSavedVillain(prev => prev === id ? null : id);
  };

  const handleAddNewVillain = async () => {
    const trimmed = newVillainText.trim();
    if (!trimmed || !selectedProfile?.id) return;
    const parts = trimmed.split(/\s+/);
    const name = parts[0];
    const description = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

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
      setNewVillainText("");
    }
  };

  const handleContinue = () => {
    if (activeTab === "character" && selectedCharacterVillain) {
      const char = selectedCharacters.find(c => c.id === selectedCharacterVillain);
      if (char) {
        onComplete({ name: char.name, role: "villain", description: char.description, type: "family" });
      }
    } else if (activeTab === "new" && selectedSavedVillain) {
      const saved = savedVillains.find(v => v.id === selectedSavedVillain);
      if (saved) {
        onComplete({ name: saved.name, role: "villain", description: saved.description, type: "special" });
      }
    }
  };

  const canContinue =
    (activeTab === "character" && !!selectedCharacterVillain) ||
    (activeTab === "new" && !!selectedSavedVillain);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FFF8F0]">
      <div className="flex-1 flex flex-col items-stretch px-4 max-w-[480px] mx-auto w-full gap-4 pb-24">
        <FablinoPageHeader
          mascotImage="/mascot/5_new_story.png"
          message={t.header}
          mascotSize="sm"
          showBackButton
          onBack={onBack}
        />

        {/* Tab Toggle */}
        <div className="flex gap-1 bg-orange-100/60 rounded-2xl p-1">
          {hasCharacters && (
            <button
              onClick={() => handleTabSwitch("character")}
              className={cn(
                "flex-1 min-h-[48px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                activeTab === "character"
                  ? "bg-white text-[#2D1810] shadow-sm"
                  : "text-[#92400E]/60 hover:text-[#92400E]"
              )}
            >
              🦸 {t.tabCharacter}
            </button>
          )}
          <button
            onClick={() => handleTabSwitch("new")}
            className={cn(
              "flex-1 min-h-[48px] py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
              activeTab === "new"
                ? "bg-white text-[#2D1810] shadow-sm"
                : "text-[#92400E]/60 hover:text-[#92400E]"
            )}
          >
            👹 {t.tabNew}
          </button>
        </div>

        {/* Tab Content: Pick from characters */}
        {activeTab === "character" && hasCharacters && (
          <div className="space-y-2 animate-fade-in">
            {selectedCharacters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelectCharacterVillain(char.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all duration-150",
                  selectedCharacterVillain === char.id
                    ? "border-red-400 bg-red-50 shadow-sm"
                    : "border-orange-100 bg-white hover:border-orange-200"
                )}
              >
                <span className="text-base font-medium text-[#2D1810]">{char.name}</span>
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full transition-colors",
                  selectedCharacterVillain === char.id
                    ? "bg-red-400 text-white"
                    : "bg-gray-100 text-gray-400"
                )}>
                  {selectedCharacterVillain === char.id ? t.markAsVillain : "😈"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tab Content: New / invented villain */}
        {activeTab === "new" && (
          <div className="space-y-4 animate-fade-in">
            {/* Text input for new villain */}
            <div className="relative">
              <Textarea
                value={newVillainText}
                onChange={(e) => setNewVillainText(e.target.value)}
                placeholder={t.describePlaceholder}
                maxLength={200}
                className="min-h-[56px] max-h-[120px] text-base resize-none rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 pr-14 bg-white"
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
                className="px-5 py-2.5 rounded-xl bg-[#E8863A] text-white text-sm font-semibold hover:bg-[#D4752E] transition-colors active:scale-[0.98] shadow-sm"
              >
                + {t.addButton}
              </button>
            )}

            {/* Saved villains */}
            {savedVillains.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#92400E]/70 mb-2">{t.orSaved}</p>
                <div className="flex flex-wrap gap-2">
                  {savedVillains.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSelectSavedVillain(v.id)}
                      className={cn(
                        "px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150",
                        selectedSavedVillain === v.id
                          ? "border-red-400 bg-red-50 text-red-700 shadow-sm"
                          : "border-orange-100 bg-white text-[#2D1810] hover:border-orange-200"
                      )}
                    >
                      😈 {v.name}
                      {v.description && (
                        <span className="text-xs text-[#2D1810]/50 ml-1">({v.description})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="max-w-[480px] mx-auto px-4 pt-3 pb-3 bg-gradient-to-t from-[#FFF8F0] via-[#FFF8F0]/95 to-transparent">
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
