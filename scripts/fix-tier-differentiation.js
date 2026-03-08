/**
 * Fix tier1/tier2 differentiation in vocabulary database
 * Ensures tier1 uses simpler, more basic vocabulary than tier2
 */

const fs = require('fs');
const path = require('path');

// Read the vocabulary data
const vocabPath = path.join(__dirname, '..', 'plain_english_a_to_z-1.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

// Fixes for IDENTICAL tier1/tier2 entries
// tier1 should use more basic, everyday language
const identicalFixes = {
  'element': {
    tier2: ['part', 'piece'],
    tier1: ['bit', 'thing']  // More basic than "part"
  },
  'factor': {
    tier2: ['cause', 'reason'],
    tier1: ['thing', 'cause']  // Keep "cause", replace "reason"
  },
  'illustrate': {
    tier2: ['show', 'explain'],
    tier1: ['draw', 'picture']  // More concrete/visual
  },
  'perceive': {
    tier2: ['notice', 'sense'],
    tier1: ['see', 'feel']  // More basic sensory words
  },
  'principle': {
    tier2: ['rule', 'guideline'],
    tier1: ['rule', 'way']  // "way" is more basic than "idea"
  },
  'various': {
    tier2: ['different', 'diverse'],
    tier1: ['many', 'lots of']  // "lots of" is more casual/basic
  }
};

// Fixes for high-overlap entries (where tier1 should be MORE basic)
const overlapFixes = {
  'access': {
    tier2: ['entry', 'use'],
    tier1: ['get in', 'use']  // "get in" is more basic than "entry"
  },
  'affect': {
    tier2: ['impact', 'influence'],
    tier1: ['change', 'touch']  // Removed overlap
  },
  'approximately': {
    tier2: ['about', 'roughly'],
    tier1: ['around', 'close to']  // More colloquial
  },
  'aspect': {
    tier2: ['feature', 'element'],
    tier1: ['part', 'side']  // Keep more basic words in tier1
  },
  'assistance': {
    tier2: ['support', 'aid'],
    tier1: ['help', 'hand']  // "hand" as in "give a hand"
  },
  'brief': {
    tier2: ['concise', 'short'],
    tier1: ['quick', 'fast']  // More basic time words
  },
  'category': {
    tier2: ['type', 'class'],
    tier1: ['group', 'kind']  // Moved tier1 words around
  },
  'cease': {
    tier2: ['discontinue', 'halt'],
    tier1: ['stop', 'end']  // tier1 gets the simpler words
  },
  'classify': {
    tier2: ['categorize', 'sort'],
    tier1: ['group', 'organize']  // Removed "group" from tier2
  },
  'commence': {
    tier2: ['begin', 'initiate'],
    tier1: ['start', 'go']  // "go" is very basic
  },
  'comprise': {
    tier2: ['consist of', 'include'],
    tier1: ['have', 'made of']  // Very basic
  },
  'concept': {
    tier2: ['notion', 'theory'],
    tier1: ['idea', 'thought']  // More basic thinking words
  },
  'considerable': {
    tier2: ['substantial', 'significant'],
    tier1: ['big', 'a lot']  // Very basic quantity
  },
  'construct': {
    tier2: ['build', 'assemble'],
    tier1: ['make', 'put together']  // "make" is more basic
  },
  'consume': {
    tier2: ['use up', 'utilize'],
    tier1: ['eat', 'use']  // Direct, basic verbs
  },
  'obtain': {
    tier2: ['acquire', 'gain'],
    tier1: ['get', 'find']  // Most basic acquisition
  },
  'portion': {
    tier2: ['section', 'segment'],
    tier1: ['part', 'piece']  // Most basic division words
  },
  'primary': {
    tier2: ['main', 'principal'],
    tier1: ['first', 'top']  // Very simple
  },
  'purchase': {
    tier2: ['acquire', 'obtain'],
    tier1: ['buy', 'get']  // Most basic commerce
  },
  'region': {
    tier2: ['area', 'zone'],
    tier1: ['place', 'spot']  // Very basic location
  },
  'retain': {
    tier2: ['maintain', 'preserve'],
    tier1: ['keep', 'hold']  // Most basic possession
  },
  'select': {
    tier2: ['choose', 'pick'],
    tier1: ['pick', 'take']  // "take" is very basic
  },
  'significant': {
    tier2: ['important', 'meaningful'],
    tier1: ['big', 'major']  // Very basic importance
  },
  'subsequent': {
    tier2: ['following', 'next'],
    tier1: ['after', 'later']  // Most basic sequence
  },
  'sufficient': {
    tier2: ['adequate', 'enough'],
    tier1: ['enough', 'OK']  // "OK" is very casual/basic
  },
  'utilize': {
    tier2: ['employ', 'apply'],
    tier1: ['use', 'try']  // Most basic usage
  }
};

let changeCount = 0;
const allFixes = { ...identicalFixes, ...overlapFixes };

// Apply fixes
data.forEach(entry => {
  if (allFixes[entry.tier3]) {
    const fix = allFixes[entry.tier3];
    entry.tier2 = fix.tier2;
    entry.tier1 = fix.tier1;
    console.log(`✓ Fixed: ${entry.tier3}`);
    console.log(`  tier2: [${fix.tier2.join(', ')}]`);
    console.log(`  tier1: [${fix.tier1.join(', ')}]`);
    changeCount++;
  }
});

// Write back
fs.writeFileSync(vocabPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✓ Fixed ${changeCount} vocabulary entries for better tier differentiation`);
console.log('✓ Vocabulary database updated');
