/**
 * Fix inflected base forms in vocabulary database
 * Converts tier3 words from inflected forms (illustrated, anticipated) to base forms (illustrate, anticipate)
 */

const fs = require('fs');
const path = require('path');

// Read the vocabulary data
const vocabPath = path.join(__dirname, '..', 'plain_english_a_to_z-1.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

// Stem to base form conversions
function stemToBase(word) {
  // Handle -ed endings
  if (word.endsWith('ated')) return word.slice(0, -1); // anticipated → anticipate
  if (word.endsWith('eted')) return word; // competed → competed (already base)
  if (word.endsWith('ited')) return word.slice(0, -1); // limited → limite → limit
  if (word.endsWith('ted') && word[word.length - 4] === word[word.length - 5]) {
    return word.slice(0, -3); // committed → commit (double consonant)
  }
  if (word.endsWith('ied')) return word.slice(0, -3) + 'y'; // carried → carry
  if (word.endsWith('ed')) {
    // Try removing just 'd' for words ending in 'e'
    if (word.endsWith('ced') || word.endsWith('ded') || word.endsWith('ged') ||
        word.endsWith('ked') || word.endsWith('led') || word.endsWith('med') ||
        word.endsWith('ned') || word.endsWith('ped') || word.endsWith('red') ||
        word.endsWith('sed') || word.endsWith('ted') || word.endsWith('ved') ||
        word.endsWith('zed')) {
      return word.slice(0, -1); // confined → confine, attached → attache (will handle below)
    }
    return word.slice(0, -2); // assumed → assume
  }

  // Handle -es plurals/verbs
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'; // categories → category
  if (word.endsWith('es')) return word.slice(0, -2); // circumstances might be plural
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1); // attitudes → attitude

  return word;
}

// Specific manual corrections for tricky cases
const manualCorrections = {
  'anticipated': 'anticipate',
  'assigned': 'assign',
  'attached': 'attach',
  'attained': 'attain',
  'attitudes': 'attitude',
  'attributed': 'attribute',
  'categories': 'category',
  'circumstances': 'circumstance',
  'colleagues': 'colleague',
  'compiled': 'compile',
  'confined': 'confine',
  'confirmed': 'confirm',
  'consequences': 'consequence',
  'converted': 'convert',
  'convinced': 'convince',
  'derived': 'derive',
  'detected': 'detect',
  'devoted': 'devote',
  'illustrated': 'illustrate'
};

let changeCount = 0;

// Fix each entry
data.forEach(entry => {
  const original = entry.tier3;

  // Check if this is a manual correction case
  if (manualCorrections[original]) {
    entry.tier3 = manualCorrections[original];
    console.log(`✓ Fixed: ${original} → ${entry.tier3}`);
    changeCount++;
  }
  // Or if it ends with common inflection suffixes
  else if (original.endsWith('ed') || (original.endsWith('es') && original.length > 4) ||
           (original.endsWith('s') && !original.endsWith('ss') && original.length > 4)) {
    const base = stemToBase(original);
    if (base !== original && base.length > 2) {
      entry.tier3 = base;
      console.log(`✓ Fixed: ${original} → ${base}`);
      changeCount++;
    }
  }
});

// Write back
fs.writeFileSync(vocabPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✓ Fixed ${changeCount} inflected base forms`);
console.log(`✓ Vocabulary database updated: ${vocabPath}`);
