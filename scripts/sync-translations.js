/**
 * sync-translations.js
 * 1. Reads the CSV file and updates fr.json for existing keys
 * 2. Syncs missing keys from fr.json to ar.json and en.json (with "" placeholder)
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = 'C:\\Users\\admin\\Downloads\\Texte Nessna Up.csv';
const LOCALES_DIR = path.join(__dirname, '..', 'features', 'locales');
const FR_PATH = path.join(LOCALES_DIR, 'fr.json');
const AR_PATH = path.join(LOCALES_DIR, 'ar.json');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');

// ── Parse CSV ──────────────────────────────────────────────────────────────
function parseCsv(content) {
  const map = {};
  const lines = content.split('\n');
  // skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields: split on first comma, then second
    // Format: key,value,a_corriger
    // Values may be quoted and contain commas
    const parts = splitCsvLine(line);
    if (parts.length < 2) continue;

    const key = parts[0].trim();
    const value = parts[1].trim().replace(/^"|"$/g, ''); // remove surrounding quotes

    if (key && value) {
      map[key] = value;
    }
  }
  return map;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Main ───────────────────────────────────────────────────────────────────
const csvRaw = fs.readFileSync(CSV_PATH, 'utf8');
const csvMap = parseCsv(csvRaw);

const fr = JSON.parse(fs.readFileSync(FR_PATH, 'utf8'));
const ar = JSON.parse(fs.readFileSync(AR_PATH, 'utf8'));
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));

let frUpdated = 0;
let arAdded = 0;
let enAdded = 0;

// 1. Update fr.json for keys that exist in both fr.json AND csv
for (const [key, csvValue] of Object.entries(csvMap)) {
  if (Object.prototype.hasOwnProperty.call(fr, key)) {
    if (fr[key] !== csvValue) {
      fr[key] = csvValue;
      frUpdated++;
    }
  }
}

// 2. Sync missing keys to ar.json and en.json
for (const key of Object.keys(fr)) {
  if (!Object.prototype.hasOwnProperty.call(ar, key)) {
    ar[key] = '';
    arAdded++;
  }
  if (!Object.prototype.hasOwnProperty.call(en, key)) {
    en[key] = '';
    enAdded++;
  }
}

// ── Write ──────────────────────────────────────────────────────────────────
fs.writeFileSync(FR_PATH, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(AR_PATH, JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync(EN_PATH, JSON.stringify(en, null, 2), 'utf8');

console.log(`✅ fr.json: ${frUpdated} values updated`);
console.log(`✅ ar.json: ${arAdded} missing keys added`);
console.log(`✅ en.json: ${enAdded} missing keys added`);
