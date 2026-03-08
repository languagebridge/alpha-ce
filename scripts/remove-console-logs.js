/**
 * Script to replace console.log statements with logger utility
 * Run with: node scripts/remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Files to process (production code only, not node_modules)
const filesToProcess = [
  'content/azure-client.js',
  'content/toolbar.js',
  'content/google-docs-adapter.js',
  'content/analytics.js',
  'content/floating-translator.js',
  'content/activation-modal.js',
  'background.js',
  'options/options.js',
  'popup/popup.js',
  'onboarding/onboarding.js'
];

const projectRoot = path.join(__dirname, '..');

function processFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (file not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Count console statements
  const consoleLogCount = (content.match(/console\.log/g) || []).length;
  const consoleWarnCount = (content.match(/console\.warn/g) || []).length;
  const consoleErrorCount = (content.match(/console\.error/g) || []).length;

  if (consoleLogCount === 0 && consoleWarnCount === 0 && consoleErrorCount === 0) {
    console.log(`✓  ${filePath} - No console statements found`);
    return;
  }

  // DO NOT add imports for content scripts - they use logger globally via manifest
  // Only background.js (service worker module) needs the import, and it already has it
  // Content scripts, options, and popup use logger loaded globally via script tags

  // Replace console statements with logger equivalents
  // logger.js will handle debug mode toggling for production
  content = content.replace(/console\.log\(/g, 'logger.log(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  content = content.replace(/console\.error\(/g, 'logger.error(');
  content = content.replace(/console\.info\(/g, 'logger.log(');

  // Write back to file
  fs.writeFileSync(fullPath, content, 'utf8');

  const totalReplaced = consoleLogCount + consoleWarnCount + consoleErrorCount;
  console.log(`✓  ${filePath} - Replaced ${totalReplaced} console statements (${consoleLogCount} log, ${consoleWarnCount} warn, ${consoleErrorCount} error)`);
}

// Process all files
console.log('🔧 Removing console.log statements from production code...\n');

filesToProcess.forEach(processFile);

console.log('\n✅ Done! All console.log statements replaced with logger.log()');
console.log('   Set IS_DEVELOPMENT = false in utils/logger.js for production builds');
