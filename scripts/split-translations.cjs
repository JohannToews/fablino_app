const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src/lib/translations.ts');
const OUT_DIR = path.resolve(__dirname, '../src/lib/translations');

const LANGS = ['de','en','fr','es','nl','it','bs','tr','bg','ro','pl','lt','hu','ca','sl','pt','sk'];

const file = fs.readFileSync(SRC, 'utf-8');
const lines = file.split('\n');

// 1. Extract interface body (between "export interface Translations {" and closing "}")
const ifaceStart = lines.findIndex(l => l.startsWith('export interface Translations {'));
let ifaceEnd = -1;
let depth = 0;
for (let i = ifaceStart; i < lines.length; i++) {
  if (lines[i].includes('{')) depth++;
  if (lines[i].includes('}')) { depth--; if (depth === 0) { ifaceEnd = i; break; } }
}
const ifaceBody = lines.slice(ifaceStart + 1, ifaceEnd).join('\n');

// Extract all key names from interface
const keyRegex = /^\s+(\w+):\s*string;/gm;
const allKeys = [];
let m;
while ((m = keyRegex.exec(ifaceBody)) !== null) {
  allKeys.push(m[1]);
}
console.log(`Found ${allKeys.length} translation keys`);

// 2. Find each language block and extract key-value pairs
const langData = {};
for (const lang of LANGS) {
  const blockStartRegex = new RegExp(`^  ${lang}: \\{`, 'm');
  const match = file.match(blockStartRegex);
  if (!match) { console.error(`Block not found: ${lang}`); continue; }
  
  const startIdx = match.index;
  let d = 0;
  let closeIdx = -1;
  const firstBrace = file.indexOf('{', startIdx);
  for (let i = firstBrace; i < file.length; i++) {
    if (file[i] === '{') d++;
    if (file[i] === '}') { d--; if (d === 0) { closeIdx = i; break; } }
  }
  
  const blockContent = file.substring(firstBrace + 1, closeIdx);
  
  // Parse key-value pairs — handle single-quoted strings with possible escaped quotes
  const kvRegex = /^\s+(\w+):\s*'((?:[^'\\]|\\.)*)'/gm;
  const pairs = {};
  let kv;
  while ((kv = kvRegex.exec(blockContent)) !== null) {
    pairs[kv[1]] = kv[2].replace(/\\'/g, "'");
  }
  
  langData[lang] = pairs;
  console.log(`  ${lang}: ${Object.keys(pairs).length} keys extracted`);
}

// 3. Create output directory
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 4. Write each language file
for (const lang of LANGS) {
  const pairs = langData[lang] || {};
  let content = `import type { Translations } from './index';\n\n`;
  content += `const ${lang}: Translations = {\n`;
  
  for (const key of allKeys) {
    const val = pairs[key];
    if (val === undefined) {
      // Missing key — use empty string (fallback will handle it)
      content += `  ${key}: '',\n`;
    } else {
      const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      content += `  ${key}: '${escaped}',\n`;
    }
  }
  
  content += `};\n\nexport default ${lang};\n`;
  
  const filePath = path.join(OUT_DIR, `${lang}.ts`);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Written: ${lang}.ts (${content.split('\n').length} lines)`);
}

// 5. Write index.ts
let indexContent = `// i18n system — split into per-language files\n\n`;

// Type export
indexContent += `export type Language = ${LANGS.map(l => `'${l}'`).join(' | ')};\n\n`;

// Translations interface
indexContent += `export interface Translations {\n${ifaceBody}\n}\n\n`;

// Imports
for (const lang of LANGS) {
  indexContent += `import ${lang} from './${lang}';\n`;
}

indexContent += `\nconst translations: Record<Language, Translations> = {\n`;
indexContent += LANGS.map(l => `  ${l},`).join('\n');
indexContent += `\n};\n\n`;

// Fallback + getTranslations + useTranslations
indexContent += `const FALLBACK_CHAIN: Language[] = ['en', 'de'];\n\n`;
indexContent += `export const getTranslations = (lang: Language): Translations => {\n`;
indexContent += `  if (translations[lang]) return translations[lang];\n`;
indexContent += `  for (const fb of FALLBACK_CHAIN) {\n`;
indexContent += `    if (translations[fb]) return translations[fb];\n`;
indexContent += `  }\n`;
indexContent += `  return translations.de;\n`;
indexContent += `};\n\n`;
indexContent += `export const useTranslations = (lang: Language) => {\n`;
indexContent += `  return getTranslations(lang);\n`;
indexContent += `};\n`;

fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), indexContent, 'utf-8');
console.log(`\nWritten: index.ts (${indexContent.split('\n').length} lines)`);
console.log(`\nDone! ${LANGS.length + 1} files created in src/lib/translations/`);
