const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../src/lib/translations.ts');

const keys = {
  hookLoginFailed: { de:'Login fehlgeschlagen', en:'Login failed', fr:'Connexion échouée', es:'Inicio de sesión fallido', nl:'Inloggen mislukt', it:'Accesso fallito', bs:'Prijava neuspješna' },
  hookProfileNotFound: { de:'Benutzerprofil nicht gefunden', en:'User profile not found', fr:'Profil utilisateur introuvable', es:'Perfil de usuario no encontrado', nl:'Gebruikersprofiel niet gevonden', it:'Profilo utente non trovato', bs:'Korisnički profil nije pronađen' },
  hookInvalidCredentials: { de:'Ungültige Anmeldedaten', en:'Invalid credentials', fr:'Identifiants invalides', es:'Credenciales inválidas', nl:'Ongeldige inloggegevens', it:'Credenziali non valide', bs:'Neispravni podaci za prijavu' },
  hookAccountMigrated: { de:'Dieses Konto wurde migriert. Bitte melde dich mit deiner E-Mail-Adresse an.', en:'This account has been migrated. Please sign in with your email address.', fr:'Ce compte a été migré. Veuillez vous connecter avec votre adresse e-mail.', es:'Esta cuenta ha sido migrada. Inicia sesión con tu correo electrónico.', nl:'Dit account is gemigreerd. Log in met je e-mailadres.', it:'Questo account è stato migrato. Accedi con il tuo indirizzo e-mail.', bs:'Ovaj račun je migriran. Prijavite se sa svojom e-mail adresom.' },
  hookPerfectQuiz: { de:'Für ein perfektes Quiz!', en:'For a perfect quiz!', fr:'Pour un quiz parfait !', es:'¡Por un quiz perfecto!', nl:'Voor een perfecte quiz!', it:'Per un quiz perfetto!', bs:'Za savršen kviz!' },
};

let file = fs.readFileSync(FILE, 'utf-8');
const keyNames = Object.keys(keys);
console.log(`Adding ${keyNames.length} keys`);

// STEP 1: Add to interface — find "// Auth & Onboarding" in interface and insert before it
const interfaceMarker = '  // Auth & Onboarding\n  authError: string;';
const interfaceInsert = '  // Hooks\n' + keyNames.map(k => `  ${k}: string;`).join('\n') + '\n\n  ';
file = file.replace(interfaceMarker, interfaceInsert + interfaceMarker);

// STEP 2: Add to each language block — insert before each "// Auth & Onboarding" comment in the translations object
const coreLangs = ['de', 'en', 'fr', 'es', 'nl', 'it', 'bs'];
const allLangs = ['de', 'en', 'fr', 'es', 'nl', 'it', 'bs', 'tr', 'bg', 'ro', 'pl', 'lt', 'hu', 'ca', 'sl', 'pt', 'sk'];

// Find all occurrences of "    // Auth & Onboarding\n    authError:" in the translations object
let searchFrom = file.indexOf('const translations');
let count = 0;
while (true) {
  const marker = '    // Auth & Onboarding\n    authError:';
  const idx = file.indexOf(marker, searchFrom);
  if (idx === -1) break;
  
  const lang = allLangs[count];
  if (!lang) break;
  
  let entries = '    // Hooks\n';
  for (const [key, translations] of Object.entries(keys)) {
    const value = coreLangs.includes(lang) ? (translations[lang] || translations.en) : translations.en;
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    entries += `    ${key}: '${escaped}',\n`;
  }
  entries += '\n    ';
  
  file = file.substring(0, idx) + entries + file.substring(idx);
  searchFrom = idx + entries.length + marker.length;
  count++;
}

fs.writeFileSync(FILE, file, 'utf-8');
console.log(`Done! Added to ${count} language blocks. File: ${file.split('\n').length} lines`);
