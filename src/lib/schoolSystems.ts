// Extended school systems with more grades
export interface SchoolSystem {
  name: string;
  classes: string[];
}

export interface SchoolSystems {
  [key: string]: SchoolSystem;
}

// Extended school systems: German 3-10, French P1-S3
export const DEFAULT_SCHOOL_SYSTEMS: SchoolSystems = {
  fr: { 
    name: "Français", 
    classes: [
      "P1 (Primaire 1)",
      "P2 (Primaire 2)",
      "P3 (Primaire 3)",
      "P4 (Primaire 4)",
      "P5 (Primaire 5)",
      "P6 (Primaire 6)",
      "S1 (Secondaire 1)",
      "S2 (Secondaire 2)",
      "S3 (Secondaire 3)",
    ] 
  },
  de: { 
    name: "Deutsch", 
    classes: [
      "3. Klasse",
      "4. Klasse",
      "5. Klasse",
      "6. Klasse",
      "7. Klasse",
      "8. Klasse",
      "9. Klasse",
      "10. Klasse",
    ] 
  },
  es: { 
    name: "Español", 
    classes: [
      "3º Primaria",
      "4º Primaria",
      "5º Primaria",
      "6º Primaria",
      "1º ESO",
      "2º ESO",
      "3º ESO",
      "4º ESO",
    ] 
  },
  nl: { 
    name: "Nederlands", 
    classes: [
      "Groep 5",
      "Groep 6",
      "Groep 7",
      "Groep 8",
      "1e klas",
      "2e klas",
      "3e klas",
      "4e klas",
    ] 
  },
  en: { 
    name: "English", 
    classes: [
      "Grade 3",
      "Grade 4",
      "Grade 5",
      "Grade 6",
      "Grade 7",
      "Grade 8",
      "Grade 9",
      "Grade 10",
    ] 
  },
};
