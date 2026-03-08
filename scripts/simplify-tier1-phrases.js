/**
 * Simplify tier1 multi-word phrases to single words where possible
 * Single words are preferred by the chooseBestSynonym algorithm
 */

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./plain_english_a_to_z-1.json', 'utf8'));

// Replace multi-word tier1 phrases with simpler single-word alternatives
const simplifications = {
  'access': { tier1: ['get', 'enter'] },  // was: ['get in', 'use']
  'approximately': { tier1: ['around', 'about'] },  // was: ['around', 'close to']
  'assistance': { tier1: ['help'] },  // was: ['help', 'hand']
  'comprise': { tier1: ['have', 'include'] },  // was: ['have', 'made of']
  'considerable': { tier1: ['big', 'much'] },  // was: ['big', 'a lot']
  'construct': { tier1: ['make', 'build'] },  // was: ['make', 'put together']
  'consume': { tier1: ['eat', 'use'] },  // was: ['eat', 'use']
  'element': { tier1: ['part', 'thing'] },  // was: ['bit', 'thing']
  'select': { tier1: ['pick', 'choose'] },  // was: ['pick', 'take']
  'sufficient': { tier1: ['enough'] },  // was: ['enough', 'OK']
  'utilize': { tier1: ['use'] },  // was: ['use', 'try']
  'various': { tier1: ['many', 'different'] }  // was: ['many', 'lots of']
};

let count = 0;
data.forEach(entry => {
  if (simplifications[entry.tier3]) {
    const oldTier1 = JSON.stringify(entry.tier1);
    entry.tier1 = simplifications[entry.tier3].tier1;
    console.log(`✓ ${entry.tier3}: ${oldTier1} → [${entry.tier1.join(', ')}]`);
    count++;
  }
});

fs.writeFileSync('./plain_english_a_to_z-1.json', JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✓ Simplified ${count} tier1 entries to single-word forms`);
