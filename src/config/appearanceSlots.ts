/**
 * Fablino Avatar v2 — Slot-based appearance config.
 * appearance_data (JSONB) keys and options with anchor fragments for image prompts.
 * No DB queries, no UI; config-only.
 */

// ─── Interfaces ─────────────────────────────────────────────────────────────

export type AgeCategory = 'child' | 'teen' | 'adult' | 'senior';
export type SlotCategory = 'face' | 'hair' | 'body' | 'accessories' | 'details';
export type PickerType = 'color' | 'icon_carousel' | 'toggle' | 'size_slider' | 'button_group';

export interface AppearanceOption {
  value: string;
  label: Record<string, string>;
  icon?: string;
  hex?: string;
  anchorFragment: string;
}

export interface AppearanceSlot {
  key: string;
  label: Record<string, string>;
  category: SlotCategory;
  pickerType: PickerType;
  options: AppearanceOption[];
  availableFor: AgeCategory[];
  genderFilter?: ('male' | 'female' | null)[];
  phase: number;
  required: boolean;
}

/** What is stored in JSONB appearance_data: slot key → option value (string or boolean for toggle). */
export type AppearanceData = Record<string, string | boolean>;

// ─── Constants ─────────────────────────────────────────────────────────────

export const CURRENT_PHASE = 1;

// ─── Phase 1 Slots ──────────────────────────────────────────────────────────

const SLOT_SKIN_TONE: AppearanceSlot = {
  key: 'skin_tone',
  label: { de: 'Hautton', en: 'Skin tone', fr: 'Teint', es: 'Tono de piel', nl: 'Huidskleur', it: 'Carnagione', bs: 'Ton kože', tr: 'Ten rengi', bg: 'Тен', ro: 'Tonul pielii', pl: 'Karnacja', lt: 'Odos atspalvis', hu: 'Bőrszín', ca: 'To de pell', sl: 'Ton kože', pt: 'Tom de pele', sk: 'Odtieň pleti', ru: 'Тон кожи', uk: 'Тон шкіри' },
  category: 'face',
  pickerType: 'color',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'light', label: { de: 'Hell', en: 'Light' }, hex: '#FDDBB4', anchorFragment: 'light skin' },
    { value: 'medium_light', label: { de: 'Hell-Mittel', en: 'Light medium' }, hex: '#E8B88A', anchorFragment: 'light-medium skin' },
    { value: 'medium', label: { de: 'Mittel', en: 'Medium' }, hex: '#C68E6A', anchorFragment: 'medium skin tone' },
    { value: 'medium_dark', label: { de: 'Mittel-Dunkel', en: 'Medium dark' }, hex: '#A0674B', anchorFragment: 'medium-dark skin' },
    { value: 'dark', label: { de: 'Dunkel', en: 'Dark' }, hex: '#6B3F2E', anchorFragment: 'dark skin' },
    { value: 'very_dark', label: { de: 'Sehr dunkel', en: 'Very dark' }, hex: '#3B2314', anchorFragment: 'very dark skin' },
  ],
};

const SLOT_EYE_COLOR: AppearanceSlot = {
  key: 'eye_color',
  label: { de: 'Augenfarbe', en: 'Eye color', fr: 'Couleur des yeux', es: 'Color de ojos', nl: 'Oogkleur', it: 'Colore degli occhi', bs: 'Boja očiju', tr: 'Göz rengi', bg: 'Цвят на очите', ro: 'Culoarea ochilor', pl: 'Kolor oczu', lt: 'Akių spalva', hu: 'Szemszín', ca: 'Color dels ulls', sl: 'Barva oči', pt: 'Cor dos olhos', sk: 'Farba očí', ru: 'Цвет глаз', uk: 'Колір очей' },
  category: 'face',
  pickerType: 'color',
  phase: 1,
  required: false,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'brown', label: { de: 'Braun', en: 'Brown' }, hex: '#8B5E3C', anchorFragment: 'brown eyes' },
    { value: 'dark_brown', label: { de: 'Dunkelbraun', en: 'Dark brown' }, hex: '#3B2314', anchorFragment: 'dark brown eyes' },
    { value: 'green', label: { de: 'Grün', en: 'Green' }, hex: '#5B8C5A', anchorFragment: 'green eyes' },
    { value: 'blue', label: { de: 'Blau', en: 'Blue' }, hex: '#5B8FB9', anchorFragment: 'blue eyes' },
    { value: 'gray', label: { de: 'Grau', en: 'Gray' }, hex: '#8E9196', anchorFragment: 'gray eyes' },
    { value: 'hazel', label: { de: 'Haselnuss', en: 'Hazel' }, hex: '#A0784E', anchorFragment: 'hazel eyes' },
  ],
};

const SLOT_GLASSES: AppearanceSlot = {
  key: 'glasses',
  label: { de: 'Brille', en: 'Glasses', fr: 'Lunettes', es: 'Gafas', nl: 'Bril', it: 'Occhiali', bs: 'Naočale', tr: 'Gözlük', bg: 'Очила', ro: 'Ochelari', pl: 'Okulary', lt: 'Akiniai', hu: 'Szemüveg', ca: 'Ulleres', sl: 'Očala', pt: 'Óculos', sk: 'Okuliare', ru: 'Очки', uk: 'Окуляри' },
  category: 'face',
  pickerType: 'toggle',
  phase: 1,
  required: false,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'false', label: { de: 'Keine', en: 'None', fr: 'Non', es: 'No', nl: 'Nee', it: 'No', bs: 'Ne', tr: 'Yok', bg: 'Не', ro: 'Nu', pl: 'Nie', lt: 'Ne', hu: 'Nem', ca: 'No', sl: 'Ne', pt: 'Não', sk: 'Nie', ru: 'Нет', uk: 'Ні' }, anchorFragment: '' },
    { value: 'true', label: { de: 'Brille', en: 'Glasses', fr: 'Lunettes', es: 'Gafas', nl: 'Bril', it: 'Occhiali', bs: 'Naočale', tr: 'Gözlük', bg: 'Очила', ro: 'Ochelari', pl: 'Okulary', lt: 'Akiniai', hu: 'Szemüveg', ca: 'Ulleres', sl: 'Očala', pt: 'Óculos', sk: 'Okuliare', ru: 'Очки', uk: 'Окуляри' }, anchorFragment: 'wearing glasses' },
  ],
};

const SLOT_HAIR_COLOR: AppearanceSlot = {
  key: 'hair_color',
  label: { de: 'Haarfarbe', en: 'Hair color', fr: 'Couleur de cheveux', es: 'Color de pelo', nl: 'Haarkleur', it: 'Colore dei capelli', bs: 'Boja kose', tr: 'Saç rengi', bg: 'Цвят на косата', ro: 'Culoarea părului', pl: 'Kolor włosów', lt: 'Plaukų spalva', hu: 'Hajszín', ca: 'Color de cabell', sl: 'Barva las', pt: 'Cor do cabelo', sk: 'Farba vlasov', ru: 'Цвет волос', uk: 'Колір волосся' },
  category: 'hair',
  pickerType: 'color',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'black', label: { de: 'Schwarz', en: 'Black' }, hex: '#1A1A1A', anchorFragment: 'black hair' },
    { value: 'dark_brown', label: { de: 'Dunkelbraun', en: 'Dark brown' }, hex: '#3B2314', anchorFragment: 'dark brown hair' },
    { value: 'brown', label: { de: 'Braun', en: 'Brown' }, hex: '#6B4226', anchorFragment: 'brown hair' },
    { value: 'blonde', label: { de: 'Blond', en: 'Blonde' }, hex: '#D4AA6A', anchorFragment: 'blonde hair' },
    { value: 'red', label: { de: 'Rot', en: 'Red' }, hex: '#8B3A2F', anchorFragment: 'red hair' },
    { value: 'gray', label: { de: 'Grau', en: 'Gray' }, hex: '#9E9E9E', anchorFragment: 'gray hair' },
  ],
};

const SLOT_HAIR_TYPE: AppearanceSlot = {
  key: 'hair_type',
  label: { de: 'Haartyp', en: 'Hair type', fr: 'Type de cheveux', es: 'Tipo de pelo', nl: 'Haartype', it: 'Tipo di capelli', bs: 'Tip kose', tr: 'Saç tipi', bg: 'Тип коса', ro: 'Tipul părului', pl: 'Typ włosów', lt: 'Plaukų tipas', hu: 'Hajtípus', ca: 'Tipus de cabell', sl: 'Tip las', pt: 'Tipo de cabelo', sk: 'Typ vlasov', ru: 'Тип волос', uk: 'Тип волосся' },
  category: 'hair',
  pickerType: 'icon_carousel',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'straight', label: { de: 'Glatt', en: 'Straight', fr: 'Lisses', es: 'Liso', nl: 'Steil', it: 'Lisci', bs: 'Ravna', tr: 'Düz', bg: 'Права', ro: 'Drept', pl: 'Proste', lt: 'Tiesūs', hu: 'Egyenes', ca: 'Llis', sl: 'Ravni', pt: 'Liso', sk: 'Rovné', ru: 'Прямые', uk: 'Пряме' }, icon: 'hair-straight.png', anchorFragment: 'straight' },
    { value: 'wavy', label: { de: 'Wellig', en: 'Wavy', fr: 'Ondulés', es: 'Ondulado', nl: 'Golvend', it: 'Mossi', bs: 'Valovita', tr: 'Dalgalı', bg: 'Вълниста', ro: 'Ondulat', pl: 'Faliste', lt: 'Banguoti', hu: 'Hullámos', ca: 'Ondulat', sl: 'Valoviti', pt: 'Ondulado', sk: 'Vlnité', ru: 'Волнистые', uk: 'Хвилясте' }, icon: 'hair-wavy.png', anchorFragment: 'wavy' },
    { value: 'curly', label: { de: 'Lockig', en: 'Curly', fr: 'Bouclés', es: 'Rizado', nl: 'Krullend', it: 'Ricci', bs: 'Kovrčava', tr: 'Kıvırcık', bg: 'Къдрава', ro: 'Creț', pl: 'Kręcone', lt: 'Garbanoti', hu: 'Göndör', ca: 'Arrissat', sl: 'Kodrasti', pt: 'Encaracolado', sk: 'Kučeravé', ru: 'Кудрявые', uk: 'Кучеряве' }, icon: 'hair-curly.png', anchorFragment: 'curly' },
    { value: 'tight_curly', label: { de: 'Krauses', en: 'Tight curly', fr: 'Frisés', es: 'Muy rizado', nl: 'Kroeshaar', it: 'Crespi', bs: 'Kovrčava gusta', tr: 'Sıkı kıvırcık', bg: 'Силно къдрава', ro: 'Foarte creț', pl: 'Bardzo kręcone', lt: 'Labai garbanoti', hu: 'Apró göndör', ca: 'Molt arrissat', sl: 'Zelo kodrasti', pt: 'Muito encaracolado', sk: 'Veľmi kučeravé', ru: 'Сильно кудрявые', uk: 'Дуже кучеряве' }, icon: 'hair-tight-curly.png', anchorFragment: 'tight curly' },
    { value: 'coily', label: { de: 'Afro', en: 'Coily', fr: 'Crépus', es: 'Afro', nl: 'Afro', it: 'Afro', bs: 'Afro', tr: 'Afro', bg: 'Афро', ro: 'Afro', pl: 'Afro', lt: 'Afro', hu: 'Afro', ca: 'Afro', sl: 'Afro', pt: 'Afro', sk: 'Afro', ru: 'Афро', uk: 'Афро' }, icon: 'hair-afro.png', anchorFragment: 'afro-textured' },
  ],
};

const SLOT_HAIR_LENGTH: AppearanceSlot = {
  key: 'hair_length',
  label: { de: 'Haarlänge', en: 'Hair length', fr: 'Longueur', es: 'Largo del pelo', nl: 'Haarlengte', it: 'Lunghezza capelli', bs: 'Dužina kose', tr: 'Saç uzunluğu', bg: 'Дължина на косата', ro: 'Lungimea părului', pl: 'Długość włosów', lt: 'Plaukų ilgis', hu: 'Hajhossz', ca: 'Llargada del cabell', sl: 'Dolžina las', pt: 'Comprimento do cabelo', sk: 'Dĺžka vlasov', ru: 'Длина волос', uk: 'Довжина волосся' },
  category: 'hair',
  pickerType: 'button_group',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'bald', label: { de: 'Keine Haare', en: 'Bald', fr: 'Chauve', es: 'Calvo', nl: 'Kaal', it: 'Calvo', tr: 'Kel', pl: 'Łysy', ru: 'Лысый', uk: 'Лисий', bs: 'Ćelav', bg: 'Плешив', ro: 'Chel', lt: 'Plikas', hu: 'Kopasz', ca: 'Calb', sl: 'Plešast', pt: 'Careca', sk: 'Plešatý' }, anchorFragment: 'bald head, no hair' },
    { value: 'very_short', label: { de: 'Sehr kurz', en: 'Very short', fr: 'Très court', es: 'Muy corto', nl: 'Heel kort', it: 'Molto corto', tr: 'Çok kısa', pl: 'Bardzo krótkie', ru: 'Очень короткие', uk: 'Дуже короткі', bs: 'Vrlo kratka', bg: 'Много къса', ro: 'Foarte scurt', lt: 'Labai trumpi', hu: 'Nagyon rövid', ca: 'Molt curt', sl: 'Zelo kratki', pt: 'Muito curto', sk: 'Veľmi krátke' }, anchorFragment: 'very short' },
    { value: 'short', label: { de: 'Kurz', en: 'Short', fr: 'Court', es: 'Corto', nl: 'Kort', it: 'Corto', tr: 'Kısa', pl: 'Krótkie', ru: 'Короткие', uk: 'Короткі', bs: 'Kratka', bg: 'Къса', ro: 'Scurt', lt: 'Trumpi', hu: 'Rövid', ca: 'Curt', sl: 'Kratki', pt: 'Curto', sk: 'Krátke' }, anchorFragment: 'short' },
    { value: 'medium', label: { de: 'Mittel', en: 'Medium', fr: 'Moyen', es: 'Medio', nl: 'Middel', it: 'Medio', tr: 'Orta', pl: 'Średnie', ru: 'Средние', uk: 'Середні', bs: 'Srednja', bg: 'Средна', ro: 'Mediu', lt: 'Vidutiniai', hu: 'Közepes', ca: 'Mitjà', sl: 'Srednji', pt: 'Médio', sk: 'Stredné' }, anchorFragment: 'medium-length' },
    { value: 'long', label: { de: 'Lang', en: 'Long', fr: 'Long', es: 'Largo', nl: 'Lang', it: 'Lungo', tr: 'Uzun', pl: 'Długie', ru: 'Длинные', uk: 'Довгі', bs: 'Duga', bg: 'Дълга', ro: 'Lung', lt: 'Ilgi', hu: 'Hosszú', ca: 'Llarg', sl: 'Dolgi', pt: 'Longo', sk: 'Dlhé' }, anchorFragment: 'long' },
    { value: 'very_long', label: { de: 'Sehr lang', en: 'Very long', fr: 'Très long', es: 'Muy largo', nl: 'Heel lang', it: 'Molto lungo', tr: 'Çok uzun', pl: 'Bardzo długie', ru: 'Очень длинные', uk: 'Дуже довгі', bs: 'Vrlo duga', bg: 'Много дълга', ro: 'Foarte lung', lt: 'Labai ilgi', hu: 'Nagyon hosszú', ca: 'Molt llarg', sl: 'Zelo dolgi', pt: 'Muito longo', sk: 'Veľmi dlhé' }, anchorFragment: 'very long' },
  ],
};

const SLOT_HAIR_STYLE: AppearanceSlot = {
  key: 'hair_style',
  label: { de: 'Frisur', en: 'Hair style', fr: 'Coiffure', es: 'Peinado', nl: 'Kapsel', it: 'Acconciatura', bs: 'Frizura', tr: 'Saç modeli', bg: 'Прическа', ro: 'Coafură', pl: 'Fryzura', lt: 'Šukuosena', hu: 'Frizura', ca: 'Pentinat', sl: 'Pričeska', pt: 'Penteado', sk: 'Účes', ru: 'Причёска', uk: 'Зачіска' },
  category: 'hair',
  pickerType: 'button_group',
  phase: 1,
  required: true,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    // ── All ages, all genders ──
    { value: 'loose', label: { de: 'Offen', en: 'Loose', fr: 'Lâché', es: 'Suelto', nl: 'Los', it: 'Sciolti', bs: 'Puštena', tr: 'Açık', bg: 'Разпусната', ro: 'Liber', pl: 'Rozpuszczone', lt: 'Paleisti', hu: 'Kibontott', ca: 'Solt', sl: 'Spuščeni', pt: 'Solto', sk: 'Voľné', ru: 'Распущенные', uk: 'Розпущене' }, anchorFragment: 'worn loose' },
    { value: 'side_part', label: { de: 'Seitenscheitel', en: 'Side part', fr: 'Raie côté', es: 'Raya lateral', nl: 'Zijscheiding', it: 'Riga laterale', bs: 'Razdjeljak', tr: 'Yandan ayrık', bg: 'С път', ro: 'Cărare laterală', pl: 'Przedziałek', lt: 'Šoninis', hu: 'Oldalt elválasztott', ca: 'Ratlla lateral', sl: 'Prečesani', pt: 'Risca lateral', sk: 'Pešinka', ru: 'Боковой пробор', uk: 'Бічний проділ' }, anchorFragment: 'with a side part' },
    { value: 'ponytail', label: { de: 'Pferdeschwanz', en: 'Ponytail', fr: 'Queue de cheval', es: 'Coleta', nl: 'Paardenstaart', it: 'Coda', bs: 'Rep', tr: 'At kuyruğu', bg: 'Конска опашка', ro: 'Coadă', pl: 'Kucyk', lt: 'Arklio uodega', hu: 'Lófarok', ca: 'Cua', sl: 'Čop', pt: 'Rabo de cavalo', sk: 'Cop', ru: 'Хвост', uk: 'Хвіст' }, anchorFragment: 'in a ponytail' },
    { value: 'braids', label: { de: 'Zöpfe', en: 'Braids', fr: 'Tresses', es: 'Trenzas', nl: 'Vlechten', it: 'Trecce', bs: 'Pletenice', tr: 'Örgü', bg: 'Плитки', ro: 'Împletituri', pl: 'Warkocze', lt: 'Kasytės', hu: 'Copf', ca: 'Trenes', sl: 'Kiti', pt: 'Tranças', sk: 'Vrkoče', ru: 'Косы', uk: 'Коси' }, anchorFragment: 'in braids' },
    { value: 'two_braids', label: { de: 'Zwei Zöpfe', en: 'Two braids', fr: 'Deux tresses', es: 'Dos trenzas', nl: 'Twee vlechten', it: 'Due trecce', bs: 'Dvije pletenice', tr: 'İki örgü', bg: 'Две плитки', ro: 'Două împletituri', pl: 'Dwa warkocze', lt: 'Dvi kasytės', hu: 'Két copf', ca: 'Dues trenes', sl: 'Dva kita', pt: 'Duas tranças', sk: 'Dva vrkoče', ru: 'Две косы', uk: 'Дві коси' }, anchorFragment: 'in two braids' },
    { value: 'bun', label: { de: 'Dutt', en: 'Bun', fr: 'Chignon', es: 'Moño', nl: 'Knot', it: 'Chignon', bs: 'Punđa', tr: 'Topuz', bg: 'Кок', ro: 'Coc', pl: 'Kok', lt: 'Kuodas', hu: 'Konty', ca: 'Monyo', sl: 'Figa', pt: 'Coque', sk: 'Drdol', ru: 'Пучок', uk: 'Пучок' }, anchorFragment: 'in a bun' },
    { value: 'bob', label: { de: 'Bob', en: 'Bob' }, anchorFragment: 'bob cut' },
    { value: 'afro', label: { de: 'Afro', en: 'Afro' }, anchorFragment: 'afro hairstyle' },
    { value: 'afro_puffs', label: { de: 'Afro Puffs', en: 'Afro puffs' }, anchorFragment: 'in afro puffs' },
    { value: 'twist_out', label: { de: 'Twist-Out', en: 'Twist out' }, anchorFragment: 'twist-out style' },
    { value: 'buzz_cut', label: { de: 'Buzz Cut', en: 'Buzz cut' }, anchorFragment: 'buzz cut' },
    // ── child + teen only ──
    { value: 'pigtails', label: { de: 'Zöpfchen', en: 'Pigtails', fr: 'Couettes', es: 'Coletas', nl: 'Staartjes', it: 'Codine', bs: 'Repići', tr: 'İki kuyruk', bg: 'Опашчици', ro: 'Codițe', pl: 'Kitki', lt: 'Kasytukės', hu: 'Copfok', ca: 'Cuetes', sl: 'Čopki', pt: 'Maria-chiquinha', sk: 'Copíky', ru: 'Хвостики', uk: 'Хвостики' }, anchorFragment: 'in pigtails' },
    // ── adult + senior, female ──
    { value: 'updo', label: { de: 'Hochsteckfrisur', en: 'Updo', fr: 'Chignon haut', es: 'Recogido', nl: 'Opgestoken', it: 'Raccolto', bs: 'Podignuta', tr: 'Toplu', bg: 'Вдигната', ro: 'Coc elegant', pl: 'Upięcie', lt: 'Sukelta', hu: 'Feltűzött', ca: 'Recollit', sl: 'Speta', pt: 'Coque alto', sk: 'Vyčesané', ru: 'Высокая', uk: 'Високий пучок' }, anchorFragment: 'in an elegant updo' },
    { value: 'low_bun', label: { de: 'Tiefer Dutt', en: 'Low bun', fr: 'Chignon bas', es: 'Moño bajo', nl: 'Lage knot', it: 'Chignon basso', bs: 'Niska punđa', tr: 'Alçak topuz', bg: 'Нисък кок', ro: 'Coc jos', pl: 'Niski kok', lt: 'Žemas kuodas', hu: 'Alacsony konty', ca: 'Monyo baix', sl: 'Nizka figa', pt: 'Coque baixo', sk: 'Nízky drdol', ru: 'Низкий пучок', uk: 'Низький пучок' }, anchorFragment: 'in a low bun' },
    { value: 'pixie_cut', label: { de: 'Pixie Cut', en: 'Pixie cut' }, anchorFragment: 'pixie cut' },
    { value: 'shoulder_layered', label: { de: 'Stufenschnitt', en: 'Shoulder layered', fr: 'Dégradé', es: 'Capas', nl: 'Gelaagd', it: 'Scalato', bs: 'Stepenasto', tr: 'Katlı', bg: 'Каскада', ro: 'Trepte', pl: 'Cieniowane', lt: 'Pakopomis', hu: 'Lépcsős', ca: 'Escalat', sl: 'Stopničasto', pt: 'Repicado', sk: 'Stupňovité', ru: 'Каскад', uk: 'Каскад' }, anchorFragment: 'layered shoulder-length cut' },
    // ── adult + senior, male ──
    { value: 'slicked_back', label: { de: 'Nach hinten', en: 'Slicked back', fr: 'Plaqué', es: 'Hacia atrás', nl: 'Achterover', it: 'Pettinato indietro', bs: 'Začešljana', tr: 'Arkaya taranmış', bg: 'Назад', ro: 'Pe spate', pl: 'Zaczesane', lt: 'Atgal', hu: 'Hátrafelé', ca: 'Cap enrere', sl: 'Nazaj', pt: 'Para trás', sk: 'Dozadu', ru: 'Назад', uk: 'Назад' }, anchorFragment: 'slicked back' },
    { value: 'crew_cut', label: { de: 'Crew Cut', en: 'Crew cut' }, anchorFragment: 'crew cut' },
    { value: 'comb_over', label: { de: 'Rübergekämmt', en: 'Comb over', fr: 'Rabattu', es: 'Peinado lateral', nl: 'Overgekampt', it: 'Riportato', bs: 'Počešljana', tr: 'Yana taranmış', bg: 'Прехвърлена', ro: 'Pieptănat lateral', pl: 'Zaczesane na bok', lt: 'Šukuoti šonu', hu: 'Átsimítva', ca: 'Pentinat lateral', sl: 'Prečesani', pt: 'Penteado lateral', sk: 'Prečesané', ru: 'Зачёс', uk: 'Зачіс' }, anchorFragment: 'combed over to one side' },
    // ── adult + senior, male (hair loss) ──
    { value: 'receding', label: { de: 'Geheimratsecken', en: 'Receding', fr: 'Dégarni', es: 'Entradas', nl: 'Inhammen', it: 'Stempiato', bs: 'Začelje', tr: 'Açık alın', bg: 'Залъци', ro: 'Chelie frontală', pl: 'Zakola', lt: 'Plinkanti', hu: 'Kopaszodó', ca: 'Entrades', sl: 'Začelji', pt: 'Entradas', sk: 'Ustupujúce', ru: 'Залысины', uk: 'Залисини' }, anchorFragment: 'with a receding hairline' },
    { value: 'bald_top', label: { de: 'Halbglatze', en: 'Bald on top', fr: 'Dégarni dessus', es: 'Calvo arriba', nl: 'Kaal bovenop', it: 'Calvo sopra', bs: 'Ćelav gore', tr: 'Üstten kel', bg: 'Плешив отгоре', ro: 'Chelie sus', pl: 'Łysy na czubku', lt: 'Plikė', hu: 'Kopasz tetejű', ca: 'Calb a dalt', sl: 'Plešast zgoraj', pt: 'Calvo no topo', sk: 'Plešatý hore', ru: 'Лысина сверху', uk: 'Лисина зверху' }, anchorFragment: 'bald on top with hair on the sides' },
    { value: 'bald', label: { de: 'Glatze', en: 'Bald', fr: 'Chauve', es: 'Calvo', nl: 'Kaal', it: 'Calvo', bs: 'Ćelav', tr: 'Kel', bg: 'Плешив', ro: 'Chel', pl: 'Łysy', lt: 'Plikas', hu: 'Kopasz', ca: 'Calb', sl: 'Plešast', pt: 'Careca', sk: 'Plešatý', ru: 'Лысый', uk: 'Лисий' }, anchorFragment: 'bald head' },
    // ── senior, female ──
    { value: 'short_permed', label: { de: 'Dauerwelle', en: 'Short permed', fr: 'Permanente', es: 'Permanente', nl: 'Permanent', it: 'Permanente', bs: 'Trajna', tr: 'Perma', bg: 'Къдрици', ro: 'Permanent', pl: 'Trwała', lt: 'Cheminė', hu: 'Dauerolt', ca: 'Permanent', sl: 'Trajna', pt: 'Permanente', sk: 'Trvalá', ru: 'Химия', uk: 'Хімія' }, anchorFragment: 'short permed curls' },
    { value: 'low_bun_senior', label: { de: 'Oma-Dutt', en: 'Low bun with wisps', fr: 'Chignon classique', es: 'Moño clásico', nl: 'Klassieke knot', it: 'Chignon classico', bs: 'Klasična punđa', tr: 'Klasik topuz', bg: 'Класически кок', ro: 'Coc clasic', pl: 'Klasyczny kok', lt: 'Klasikinis', hu: 'Klasszikus konty', ca: 'Monyo clàssic', sl: 'Klasična figa', pt: 'Coque clássico', sk: 'Klasický drdol', ru: 'Классический пучок', uk: 'Класичний пучок' }, anchorFragment: 'in a low bun with wisps at the temples' },
    // ── senior, male ──
    { value: 'thin_side_part', label: { de: 'Dünner Scheitel', en: 'Thin side part', fr: 'Raie fine', es: 'Raya fina', nl: 'Dun gescheiden', it: 'Riga fine', bs: 'Tanak razdjeljak', tr: 'İnce ayrık', bg: 'Тънък път', ro: 'Cărare subțire', pl: 'Cienki przedziałek', lt: 'Plonas', hu: 'Vékony választék', ca: 'Ratlla fina', sl: 'Tanek prečesek', pt: 'Risca fina', sk: 'Tenká pešinka', ru: 'Тонкий пробор', uk: 'Тонкий проділ' }, anchorFragment: 'thin sparse hair with a side part' },
    { value: 'white_buzz', label: { de: 'Kurz geschoren', en: 'Short buzzed', fr: 'Tondu court', es: 'Rapado', nl: 'Kort geschoren', it: 'Rasato corto', bs: 'Kratko ošišana', tr: 'Kısa tıraş', bg: 'Късо подстригана', ro: 'Tuns scurt', pl: 'Krótko ostrzyżone', lt: 'Trumpai kirpti', hu: 'Rövidre nyírt', ca: 'Tallat curt', sl: 'Kratko striženi', pt: 'Raspado curto', sk: 'Krátko ostrihané', ru: 'Коротко стриженые', uk: 'Коротко стрижене' }, anchorFragment: 'very short buzzed thin hair' },
  ],
};

const SLOT_BODY_TYPE: AppearanceSlot = {
  key: 'body_type',
  label: { de: 'Körperstatur', en: 'Body type', fr: 'Corpulence', es: 'Complexión', nl: 'Lichaamsbouw', it: 'Corporatura', bs: 'Građa tijela', tr: 'Vücut tipi', bg: 'Телосложение', ro: 'Constituție', pl: 'Budowa ciała', lt: 'Kūno sudėjimas', hu: 'Testalkat', ca: 'Complexió', sl: 'Postava', pt: 'Tipo físico', sk: 'Postava', ru: 'Телосложение', uk: 'Статура' },
  category: 'body',
  pickerType: 'icon_carousel',
  phase: 1,
  required: false,
  availableFor: ['child', 'teen', 'adult', 'senior'],
  options: [
    { value: 'slim', label: { de: 'Schlank', en: 'Slim', fr: 'Mince', es: 'Delgado', nl: 'Slank', it: 'Magro', bs: 'Vitka', tr: 'İnce', bg: 'Слаба', ro: 'Slab', pl: 'Szczupła', lt: 'Liekna', hu: 'Vékony', ca: 'Prim', sl: 'Vitek', pt: 'Magro', sk: 'Štíhla', ru: 'Худое', uk: 'Худорлява' }, icon: 'body-slim.png', anchorFragment: 'slim build' },
    { value: 'average', label: { de: 'Normal', en: 'Average', fr: 'Moyen', es: 'Normal', nl: 'Gemiddeld', it: 'Medio', bs: 'Prosječna', tr: 'Orta', bg: 'Средна', ro: 'Mediu', pl: 'Przeciętna', lt: 'Vidutinė', hu: 'Átlagos', ca: 'Mitjà', sl: 'Povprečen', pt: 'Médio', sk: 'Priemerná', ru: 'Среднее', uk: 'Середня' }, icon: 'body-average.png', anchorFragment: 'average build' },
    { value: 'stocky', label: { de: 'Kräftig', en: 'Stocky', fr: 'Robuste', es: 'Robusto', nl: 'Stevig', it: 'Robusto', bs: 'Krupna', tr: 'Tıknaz', bg: 'Набита', ro: 'Robust', pl: 'Krępa', lt: 'Stipri', hu: 'Zömök', ca: 'Robust', sl: 'Čokat', pt: 'Robusto', sk: 'Statná', ru: 'Крепкое', uk: 'Кремезна' }, icon: 'body-stocky.png', anchorFragment: 'stocky build' },
  ],
};

const SLOT_FACIAL_HAIR: AppearanceSlot = {
  key: 'facial_hair',
  label: { de: 'Bart', en: 'Facial hair', fr: 'Barbe', es: 'Barba', nl: 'Baard', it: 'Barba', bs: 'Brada', tr: 'Sakal', bg: 'Брада', ro: 'Barbă', pl: 'Zarost', lt: 'Barzda', hu: 'Szakáll', ca: 'Barba', sl: 'Brada', pt: 'Barba', sk: 'Fúzy', ru: 'Борода', uk: 'Борода' },
  category: 'details',
  pickerType: 'icon_carousel',
  phase: 1,
  required: false,
  availableFor: ['adult', 'senior'],
  genderFilter: ['male'],
  options: [
    { value: 'none', label: { de: 'Kein Bart', en: 'None', fr: 'Aucune', es: 'Ninguna', nl: 'Geen', it: 'Nessuna', bs: 'Bez brade', tr: 'Yok', bg: 'Без', ro: 'Fără', pl: 'Brak', lt: 'Nėra', hu: 'Nincs', ca: 'Cap', sl: 'Brez', pt: 'Nenhuma', sk: 'Žiadne', ru: 'Нет', uk: 'Немає' }, icon: 'beard-none.png', anchorFragment: '' },
    { value: 'stubble', label: { de: 'Dreitagebart', en: 'Stubble', fr: 'Barbe de 3 jours', es: 'Barba corta', nl: 'Stoppels', it: 'Barba corta', bs: 'Trodnevna', tr: 'Sakal tıraşı', bg: 'Бръснат', ro: 'Barbă scurtă', pl: 'Trzydniowy', lt: 'Šeriai', hu: 'Borosta', ca: 'Barba curta', sl: 'Tridnevna', pt: 'Barba curta', sk: 'Strnisko', ru: 'Щетина', uk: 'Щетина' }, icon: 'beard-stubble.png', anchorFragment: 'with stubble' },
    { value: 'short_beard', label: { de: 'Kurzbart', en: 'Short beard', fr: 'Barbe courte', es: 'Barba corta', nl: 'Korte baard', it: 'Barba corta', bs: 'Kratka brada', tr: 'Kısa sakal', bg: 'Къса брада', ro: 'Barbă scurtă', pl: 'Krótka broda', lt: 'Trumpa barzda', hu: 'Rövid szakáll', ca: 'Barba curta', sl: 'Kratka brada', pt: 'Barba curta', sk: 'Krátka brada', ru: 'Короткая борода', uk: 'Коротка борода' }, icon: 'beard-short.png', anchorFragment: 'with a short beard' },
    { value: 'full_beard', label: { de: 'Vollbart', en: 'Full beard', fr: 'Barbe pleine', es: 'Barba completa', nl: 'Volle baard', it: 'Barba folta', bs: 'Puna brada', tr: 'Tam sakal', bg: 'Гъста брада', ro: 'Barbă plină', pl: 'Pełna broda', lt: 'Pilna barzda', hu: 'Teljes szakáll', ca: 'Barba plena', sl: 'Polna brada', pt: 'Barba cheia', sk: 'Plná brada', ru: 'Полная борода', uk: 'Повна борода' }, icon: 'beard-full.png', anchorFragment: 'with a full beard' },
    { value: 'mustache', label: { de: 'Schnurrbart', en: 'Mustache', fr: 'Moustache', es: 'Bigote', nl: 'Snor', it: 'Baffi', bs: 'Brkovi', tr: 'Bıyık', bg: 'Мустак', ro: 'Mustață', pl: 'Wąsy', lt: 'Ūsai', hu: 'Bajusz', ca: 'Bigoti', sl: 'Brki', pt: 'Bigode', sk: 'Fúzy', ru: 'Усы', uk: 'Вуса' }, icon: 'beard-mustache.png', anchorFragment: 'with a mustache' },
  ],
};

export const APPEARANCE_SLOTS: AppearanceSlot[] = [
  SLOT_SKIN_TONE,
  SLOT_EYE_COLOR,
  SLOT_GLASSES,
  SLOT_HAIR_COLOR,
  SLOT_HAIR_TYPE,
  SLOT_HAIR_LENGTH,
  SLOT_FACIAL_HAIR,
];

// ─── Filtering ──────────────────────────────────────────────────────────────

const HAIR_COLOR_AGE_RESTRICTED = new Set(['gray', 'white', 'silver']);

/** Hair lengths not available for adult/senior males */
const HAIR_LENGTH_EXCLUDE_ADULT_MALE = new Set(['very_long']);

/** Hair lengths only available for adult/senior males */
const HAIR_LENGTH_MALE_ONLY = new Set(['bald']);

/**
 * Returns options for a slot given age category and gender.
 * Applies availableFor, genderFilter, and special rules for hair_color / hair_length.
 */
export function getFilteredOptions(
  slot: AppearanceSlot,
  ageCategory: AgeCategory,
  gender: 'male' | 'female' | null
): AppearanceOption[] {
  if (!slot.availableFor.includes(ageCategory)) {
    return [];
  }
  if (slot.genderFilter != null && slot.genderFilter.length > 0) {
    const allowed = slot.genderFilter.includes(gender);
    if (!allowed) return [];
  }

  let options = slot.options;

  if (slot.key === 'hair_color') {
    const isAdultOrSenior = ageCategory === 'adult' || ageCategory === 'senior';
    if (!isAdultOrSenior) {
      options = options.filter((opt) => !HAIR_COLOR_AGE_RESTRICTED.has(opt.value));
    }
  }

  if (slot.key === 'hair_length') {
    const isAdultOrSenior = ageCategory === 'adult' || ageCategory === 'senior';
    const isMale = gender === 'male';
    if (isAdultOrSenior && isMale) {
      options = options.filter((opt) => !HAIR_LENGTH_EXCLUDE_ADULT_MALE.has(opt.value));
    }
    if (!isAdultOrSenior || !isMale) {
      options = options.filter((opt) => !HAIR_LENGTH_MALE_ONLY.has(opt.value));
    }
  }

  return options;
}

// ─── Age & gender inference ─────────────────────────────────────────────────

const SENIOR_RELATIONS = [
  'Oma', 'Opa', 'Grand-mère', 'Grand-père', 'Grandma', 'Grandpa',
  'Abuela', 'Abuelo', 'Nonna', 'Nonno', 'Babcia', 'Dziadek', 'Бабуся', 'Дідусь',
];
const PARENT_RELATIONS = [
  'Mama', 'Papa', 'Maman', 'Mom', 'Dad', 'Mamá', 'Papá',
  'Mamma', 'Papà', 'Мама', 'Тато',
];
const SIBLING_RELATIONS = [
  'Bruder', 'Schwester', 'Frère', 'Sœur', 'Brother', 'Sister',
  'Hermano', 'Hermana', 'Brat', 'Sestra',
];

function matchesOne(relation: string | null | undefined, list: string[]): boolean {
  if (relation == null || relation === '') return false;
  const r = relation.trim().toLowerCase();
  return list.some((x) => x.toLowerCase() === r);
}

/**
 * Infers age category from role and relation (e.g. for character_appearances).
 */
export function inferAgeCategory(
  role: string,
  relation: string | null | undefined
): AgeCategory {
  const rel = relation?.trim() ?? '';
  const roleLower = role.trim().toLowerCase();
  if (matchesOne(rel, SENIOR_RELATIONS)) return 'senior';
  if (matchesOne(rel, PARENT_RELATIONS)) return 'adult';
  if (matchesOne(rel, SIBLING_RELATIONS)) return 'child';
  if (roleLower === 'friend') return 'child';
  return 'adult';
}

const MALE_RELATIONS = [
  'Papa', 'Opa', 'Dad', 'Grandpa', 'Grand-père', 'Abuelo', 'Papá', 'Nonno', 'Dziadek', 'Тато', 'Дідусь',
  'Bruder', 'Frère', 'Brother', 'Hermano', 'Brat',
];
const FEMALE_RELATIONS = [
  'Mama', 'Oma', 'Mom', 'Grandma', 'Grand-mère', 'Abuela', 'Mamá', 'Nonna', 'Babcia', 'Мама', 'Бабуся',
  'Schwester', 'Sœur', 'Sister', 'Hermana', 'Sestra',
];

/**
 * Infers gender from relation string when possible.
 */
export function inferGenderFromRelation(relation: string | null | undefined): 'male' | 'female' | null {
  if (relation == null || relation === '') return null;
  const r = relation.trim().toLowerCase();
  if (MALE_RELATIONS.some((x) => x.toLowerCase() === r)) return 'male';
  if (FEMALE_RELATIONS.some((x) => x.toLowerCase() === r)) return 'female';
  return null;
}
