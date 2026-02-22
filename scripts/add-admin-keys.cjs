const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '../src/lib/translations');
const vals = {
  de: { createButton: 'Erstellen', saveConfig: 'Konfiguration speichern' },
  en: { createButton: 'Create', saveConfig: 'Save configuration' },
  fr: { createButton: 'Créer', saveConfig: 'Enregistrer la configuration' },
  es: { createButton: 'Crear', saveConfig: 'Guardar configuración' },
  nl: { createButton: 'Aanmaken', saveConfig: 'Configuratie opslaan' },
  it: { createButton: 'Crea', saveConfig: 'Salva configurazione' },
  bs: { createButton: 'Kreiraj', saveConfig: 'Sačuvaj konfiguraciju' },
};
const langs = ['de','en','fr','es','nl','it','bs','tr','bg','ro','pl','lt','hu','ca','sl','pt','sk'];
for (const lang of langs) {
  const fp = path.join(dir, lang + '.ts');
  let f = fs.readFileSync(fp, 'utf-8');
  const v = vals[lang] || vals.en;
  const cb = v.createButton.replace(/'/g, "\\'");
  const sc = v.saveConfig.replace(/'/g, "\\'");
  f = f.replace(
    /^(  saving: '[^']*',)$/m,
    `$1\n  createButton: '${cb}',\n  saveConfig: '${sc}',`
  );
  fs.writeFileSync(fp, f);
}
console.log('Done: 2 keys added to ' + langs.length + ' files');
