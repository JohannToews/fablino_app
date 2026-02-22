const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../src/lib/translations.ts');

const keys = {
  hookAuthProfileNotFound: { de:'Benutzerprofil nicht gefunden', en:'User profile not found', fr:'Profil utilisateur introuvable', es:'Perfil de usuario no encontrado', nl:'Gebruikersprofiel niet gevonden', it:'Profilo utente non trovato', bs:'Korisnički profil nije pronađen' },
  hookAuthLoginFailed: { de:'Login fehlgeschlagen', en:'Login failed', fr:'Connexion échouée', es:'Inicio de sesión fallido', nl:'Inloggen mislukt', it:'Accesso fallito', bs:'Prijava neuspješna' },
  hookAuthGenericError: { de:'Ein Fehler ist aufgetreten', en:'An error occurred', fr:'Une erreur est survenue', es:'Ha ocurrido un error', nl:'Er is een fout opgetreden', it:'Si è verificato un errore', bs:'Došlo je do greške' },
  hookAuthInvalidCredentials: { de:'Ungültige Anmeldedaten', en:'Invalid credentials', fr:'Identifiants invalides', es:'Credenciales inválidas', nl:'Ongeldige inloggegevens', it:'Credenziali non valide', bs:'Neispravni podaci za prijavu' },
  hookAuthMigrated: { de:'Dieses Konto wurde migriert. Bitte melde dich mit deiner E-Mail-Adresse an.', en:'This account has been migrated. Please sign in with your email address.', fr:'Ce compte a été migré. Veuillez vous connecter avec votre adresse e-mail.', es:'Esta cuenta ha sido migrada. Inicia sesión con tu correo electrónico.', nl:'Dit account is gemigreerd. Log in met je e-mailadres.', it:'Questo account è stato migrato. Accedi con il tuo indirizzo e-mail.', bs:'Ovaj račun je migriran. Prijavite se sa svojom e-mail adresom.' },
  hookCollectionPerfectQuiz: { de:'Für ein perfektes Quiz!', en:'For a perfect quiz!', fr:'Pour un quiz parfait !', es:'¡Por un quiz perfecto!', nl:'Voor een perfecte quiz!', it:'Per un quiz perfetto!', bs:'Za savršen kviz!' },
};

let file = fs.readFileSync(FILE, 'utf-8');
const keyNames = Object.keys(keys);
console.log(`Adding ${keyNames.length} keys`);

// STEP 1: Find interface closing brace
let interfaceEndLine = -1;
const lines = file.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '}' && i < 600) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') continue;
      if (lines[j].includes('const translations')) {
        interfaceEndLine = i;
        break;
      }
      break;
    }
    if (interfaceEndLine !== -1) break;
  }
}

if (interfaceEndLine === -1) {
  console.error('Could not find interface end');
  process.exit(1);
}
console.log(`Interface ends at line ${interfaceEndLine + 1}`);

const interfaceProps = keyNames.map(k => `  ${k}: string;`).join('\n');
const interfaceInsert = '\n  // Hooks\n' + interfaceProps + '\n';
lines.splice(interfaceEndLine, 0, interfaceInsert);
file = lines.join('\n');

// STEP 2: Insert into each language block
const coreLangs = ['de', 'en', 'fr', 'es', 'nl', 'it', 'bs'];
const allLangs = ['de', 'en', 'fr', 'es', 'nl', 'it', 'bs', 'tr', 'bg', 'ro', 'pl', 'lt', 'hu', 'ca', 'sl', 'pt', 'sk'];

const langBlocks = [];
for (const lang of allLangs) {
  const regex = new RegExp(`^  ${lang}: \\{`, 'm');
  const match = file.match(regex);
  if (!match) { console.log(`Block not found: ${lang}`); continue; }
  const startIdx = match.index;
  let depth = 0;
  let closeIdx = -1;
  const firstBrace = file.indexOf('{', startIdx);
  for (let i = firstBrace; i < file.length; i++) {
    if (file[i] === '{') depth++;
    if (file[i] === '}') { depth--; if (depth === 0) { closeIdx = i; break; } }
  }
  if (closeIdx === -1) { console.log(`Close not found: ${lang}`); continue; }
  langBlocks.push({ lang, closeIdx });
}

langBlocks.sort((a, b) => b.closeIdx - a.closeIdx);

for (const { lang, closeIdx } of langBlocks) {
  let entries = '\n    // Hooks\n';
  for (const [key, translations] of Object.entries(keys)) {
    const value = coreLangs.includes(lang) ? (translations[lang] || translations.en) : translations.en;
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    entries += `    ${key}: '${escaped}',\n`;
  }
  file = file.substring(0, closeIdx) + entries + '  ' + file.substring(closeIdx);
}

fs.writeFileSync(FILE, file, 'utf-8');
console.log(`Done! File now has ${file.split('\n').length} lines`);
