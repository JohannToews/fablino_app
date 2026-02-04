import { Language } from "@/lib/translations";

export type CharacterType = 
  | "me" 
  | "family" 
  | "siblings" 
  | "friends" 
  | "famous" 
  | "surprise";

export type FamilyMember = "mama" | "papa" | "oma" | "opa" | "other";

export type SpecialAttribute = 
  | "superpowers" 
  | "magic" 
  | "heroes_villains" 
  | "transformations" 
  | "talents" 
  | "normal";

export interface SelectedCharacter {
  id: string;
  type: CharacterType | FamilyMember;
  name: string;
  label: string;
}

export interface CharacterSelectionTranslations {
  header: string;
  me: string;
  family: string;
  siblings: string;
  friends: string;
  famous: string;
  surprise: string;
  mama: string;
  papa: string;
  oma: string;
  opa: string;
  other: string;
  back: string;
  addMore: string;
  yourCharacters: string;
  continue: string;
  nameModalTitle: string;
  save: string;
  cancel: string;
  nameSaved: string;
  bonusQuestion: string;
  superpowers: string;
  magic: string;
  heroesVillains: string;
  transformations: string;
  talents: string;
  normal: string;
  skip: string;
}

export const characterSelectionTranslations: Record<Language, CharacterSelectionTranslations> = {
  de: {
    header: "Wer sind die Hauptpersonen in deiner Geschichte?",
    me: "Ich",
    family: "Meine Familie",
    siblings: "Meine Geschwister",
    friends: "Meine Freunde",
    famous: "Bekannte Figuren",
    surprise: "Überrasch mich",
    mama: "Mama",
    papa: "Papa",
    oma: "Oma",
    opa: "Opa",
    other: "Weitere...",
    back: "Zurück",
    addMore: "Hinzufügen",
    yourCharacters: "Deine Hauptpersonen:",
    continue: "Weiter",
    nameModalTitle: "Wie heißt",
    save: "Speichern",
    cancel: "Abbrechen",
    nameSaved: "gespeichert",
    bonusQuestion: "Sollen manche Hauptpersonen besondere Eigenschaften haben?",
    superpowers: "Superkräfte",
    magic: "Magische Kräfte",
    heroesVillains: "Helden & Bösewichte",
    transformations: "Verwandlungen",
    talents: "Besondere Talente",
    normal: "Nein, ganz normal",
    skip: "Überspringen",
  },
  fr: {
    header: "Qui sont les personnages principaux de ton histoire?",
    me: "Moi",
    family: "Ma famille",
    siblings: "Mes frères et sœurs",
    friends: "Mes amis",
    famous: "Personnages connus",
    surprise: "Surprends-moi",
    mama: "Maman",
    papa: "Papa",
    oma: "Mamie",
    opa: "Papy",
    other: "Autres...",
    back: "Retour",
    addMore: "Ajouter",
    yourCharacters: "Tes personnages:",
    continue: "Continuer",
    nameModalTitle: "Comment s'appelle",
    save: "Enregistrer",
    cancel: "Annuler",
    nameSaved: "enregistré",
    bonusQuestion: "Certains personnages doivent-ils avoir des propriétés spéciales?",
    superpowers: "Super pouvoirs",
    magic: "Pouvoirs magiques",
    heroesVillains: "Héros & Méchants",
    transformations: "Transformations",
    talents: "Talents spéciaux",
    normal: "Non, tout à fait normal",
    skip: "Passer",
  },
  en: {
    header: "Who are the main characters in your story?",
    me: "Me",
    family: "My Family",
    siblings: "My Siblings",
    friends: "My Friends",
    famous: "Famous Characters",
    surprise: "Surprise Me",
    mama: "Mom",
    papa: "Dad",
    oma: "Grandma",
    opa: "Grandpa",
    other: "Others...",
    back: "Back",
    addMore: "Add",
    yourCharacters: "Your characters:",
    continue: "Continue",
    nameModalTitle: "What is the name of",
    save: "Save",
    cancel: "Cancel",
    nameSaved: "saved",
    bonusQuestion: "Should some characters have special abilities?",
    superpowers: "Superpowers",
    magic: "Magical Powers",
    heroesVillains: "Heroes & Villains",
    transformations: "Transformations",
    talents: "Special Talents",
    normal: "No, just normal",
    skip: "Skip",
  },
  es: {
    header: "¿Quiénes son los personajes principales de tu historia?",
    me: "Yo",
    family: "Mi familia",
    siblings: "Mis hermanos",
    friends: "Mis amigos",
    famous: "Personajes famosos",
    surprise: "Sorpréndeme",
    mama: "Mamá",
    papa: "Papá",
    oma: "Abuela",
    opa: "Abuelo",
    other: "Otros...",
    back: "Volver",
    addMore: "Añadir",
    yourCharacters: "Tus personajes:",
    continue: "Continuar",
    nameModalTitle: "¿Cómo se llama",
    save: "Guardar",
    cancel: "Cancelar",
    nameSaved: "guardado",
    bonusQuestion: "¿Deberían algunos personajes tener habilidades especiales?",
    superpowers: "Superpoderes",
    magic: "Poderes mágicos",
    heroesVillains: "Héroes y villanos",
    transformations: "Transformaciones",
    talents: "Talentos especiales",
    normal: "No, normal",
    skip: "Saltar",
  },
  nl: {
    header: "Wie zijn de hoofdpersonen in je verhaal?",
    me: "Ik",
    family: "Mijn familie",
    siblings: "Mijn broers en zussen",
    friends: "Mijn vrienden",
    famous: "Bekende figuren",
    surprise: "Verras me",
    mama: "Mama",
    papa: "Papa",
    oma: "Oma",
    opa: "Opa",
    other: "Anderen...",
    back: "Terug",
    addMore: "Toevoegen",
    yourCharacters: "Je personages:",
    continue: "Verder",
    nameModalTitle: "Hoe heet",
    save: "Opslaan",
    cancel: "Annuleren",
    nameSaved: "opgeslagen",
    bonusQuestion: "Moeten sommige personages speciale eigenschappen hebben?",
    superpowers: "Superkrachten",
    magic: "Magische krachten",
    heroesVillains: "Helden & schurken",
    transformations: "Transformaties",
    talents: "Speciale talenten",
    normal: "Nee, gewoon normaal",
    skip: "Overslaan",
  },
  it: {
    header: "Chi sono i personaggi principali della tua storia?",
    me: "Io",
    family: "La mia famiglia",
    siblings: "I miei fratelli",
    friends: "I miei amici",
    famous: "Personaggi famosi",
    surprise: "Sorprendimi",
    mama: "Mamma",
    papa: "Papà",
    oma: "Nonna",
    opa: "Nonno",
    other: "Altri...",
    back: "Indietro",
    addMore: "Aggiungi",
    yourCharacters: "I tuoi personaggi:",
    continue: "Continua",
    nameModalTitle: "Come si chiama",
    save: "Salva",
    cancel: "Annulla",
    nameSaved: "salvato",
    bonusQuestion: "Alcuni personaggi dovrebbero avere abilità speciali?",
    superpowers: "Superpoteri",
    magic: "Poteri magici",
    heroesVillains: "Eroi e cattivi",
    transformations: "Trasformazioni",
    talents: "Talenti speciali",
    normal: "No, normale",
    skip: "Salta",
  },
  bs: {
    header: "Ko su glavni likovi u tvojoj priči?",
    me: "Ja",
    family: "Moja porodica",
    siblings: "Moja braća i sestre",
    friends: "Moji prijatelji",
    famous: "Poznati likovi",
    surprise: "Iznenadi me",
    mama: "Mama",
    papa: "Tata",
    oma: "Baka",
    opa: "Djed",
    other: "Drugi...",
    back: "Nazad",
    addMore: "Dodaj",
    yourCharacters: "Tvoji likovi:",
    continue: "Nastavi",
    nameModalTitle: "Kako se zove",
    save: "Spremi",
    cancel: "Otkaži",
    nameSaved: "spremljeno",
    bonusQuestion: "Trebaju li neki likovi imati posebne sposobnosti?",
    superpowers: "Supermoći",
    magic: "Magične moći",
    heroesVillains: "Heroji i zlikovci",
    transformations: "Transformacije",
    talents: "Posebni talenti",
    normal: "Ne, normalno",
    skip: "Preskoči",
  },
};
