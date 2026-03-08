/**
 * Test with real academic text (Christmas Carol example)
 */

const christmasCarol = `A Christmas Carol. In Prose. Being a Ghost Story of Christmas, commonly known as A Christmas Carol, is a novella by Charles Dickens, first published in London by Chapman & Hall in 1843 and illustrated by John Leech. It recounts the story of Ebenezer Scrooge, an elderly miser who is visited by the ghost of his former business partner Jacob Marley and the spirits of Christmas Past, Present and Yet to Come. In the process, Scrooge is transformed into a kinder, gentler man.`;

console.log('=== CHRISTMAS CAROL TEXT - TIER COMPARISON ===\n');

console.log('TIER 3 (Original):');
console.log(christmasCarol);
console.log(`\nLength: ${christmasCarol.split(' ').length} words\n`);

console.log('─'.repeat(100));

// Simulate what TIER 2 should produce
console.log('\nTIER 2 (Academic - moderate shortening):');
console.log('Expected: Removes some details but keeps core story info');
console.log('Should be: ~40-60 words (30-50% reduction)\n');

console.log('─'.repeat(100));

// Simulate what TIER 1 should produce
console.log('\nTIER 1 (Basic - aggressive shortening):');
console.log('Expected: Removes dates, locations, author, illustrator, descriptions');
console.log('Should be: ~20-30 words (70-80% reduction)');
console.log('\nExample output:');
console.log('  "A Christmas Carol is a story. It is about Ebenezer Scrooge.');
console.log('   A ghost visits him. Scrooge becomes a kinder man."\n');

console.log('─'.repeat(100));

console.log('\nKEY IMPROVEMENTS IMPLEMENTED:');
console.log('  ✓ Tier-specific sentence reduction (tier1: 15%, tier2: 25%)');
console.log('  ✓ New shortenForTier1() function removes:');
console.log('    • Dates and years (1843)');
console.log('    • Locations (London, Chapman & Hall)');
console.log('    • Author attribution (by Charles Dickens)');
console.log('    • Illustrator credit (illustrated by John Leech)');
console.log('    • "commonly known as" phrases');
console.log('    • Descriptive clauses (elderly miser, former business partner)');
console.log('    • Long sentences split to first clause only (>80 words)');
console.log('\n  ✓ TIER 2 keeps more context for academic vocabulary building');
console.log('  ✓ TIER 1 focuses on core meaning with maximum accessibility');
