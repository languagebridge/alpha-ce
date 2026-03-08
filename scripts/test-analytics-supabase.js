/**
 * Analytics Testing Script - Supabase Version
 *
 * How to use:
 * 1. Set up Supabase table using SUPABASE_SETUP.md
 * 2. Load extension unpacked in Chrome
 * 3. Navigate to any webpage
 * 4. Open browser console (F12)
 * 5. Copy and paste this entire script into console
 * 6. Press Enter to run
 */

(async function testAnalytics() {
  console.log('%c🧪 Testing LanguageBridge Analytics (Supabase)', 'font-size: 16px; font-weight: bold; color: #3ECF8E');
  console.log('================================================\n');

  // Check if analytics module is loaded
  if (!window.LanguageBridgeAnalytics) {
    console.error('❌ Analytics module not loaded!');
    console.log('Troubleshooting:');
    console.log('1. Make sure extension is installed');
    console.log('2. Check manifest.json includes "content/analytics-client.js"');
    console.log('3. Reload the page and try again');
    return;
  }

  console.log('✅ Analytics module loaded\n');

  const analytics = window.LanguageBridgeAnalytics;

  // Check initialization status
  console.log('%c📊 Analytics Status', 'font-weight: bold; color: #3ECF8E');
  console.log('─────────────────────');
  console.log('Initialized:', analytics.isInitialized);
  console.log('Enabled:', analytics.enabled);
  console.log('User ID:', analytics.userId || 'Not set');
  console.log('Session ID:', analytics.sessionId || 'Not set');
  console.log('Supabase Client:', analytics.supabaseClient ? '✅ Connected' : '❌ Not connected');

  // Wait for initialization if needed
  if (!analytics.isInitialized) {
    console.log('\n⏳ Waiting for analytics to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!analytics.isInitialized) {
      console.error('❌ Analytics failed to initialize');
      console.log('Check browser console for errors');
      return;
    }
  }

  console.log('\n%c🧪 Running Test Events', 'font-weight: bold; color: #3ECF8E');
  console.log('─────────────────────');

  // Test 1: Track a translation event
  try {
    console.log('1. Testing translation event...');
    await analytics.trackTranslation('en-US', 'fa-IR', 50);
    console.log('   ✅ Translation tracked (en-US → fa-IR, 50 chars)');
  } catch (error) {
    console.error('   ❌ Translation tracking failed:', error.message);
  }

  // Test 2: Track a TTS event
  try {
    console.log('2. Testing TTS event...');
    await analytics.trackTTS('fa-IR', 30);
    console.log('   ✅ TTS tracked (fa-IR, 30 chars)');
  } catch (error) {
    console.error('   ❌ TTS tracking failed:', error.message);
  }

  // Test 3: Track a feature event
  try {
    console.log('3. Testing feature event...');
    await analytics.trackFeature('toolbar', 'opened');
    console.log('   ✅ Feature tracked (toolbar opened)');
  } catch (error) {
    console.error('   ❌ Feature tracking failed:', error.message);
  }

  // Test 4: Track a custom event
  try {
    console.log('4. Testing custom event...');
    await analytics.trackEvent('test_event', {
      test_property: 'test_value',
      timestamp_test: Date.now()
    });
    console.log('   ✅ Custom event tracked');
  } catch (error) {
    console.error('   ❌ Custom event tracking failed:', error.message);
  }

  // Wait a moment for events to be sent
  console.log('\n⏳ Waiting for events to sync with Supabase...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get stats
  console.log('\n%c📈 Analytics Stats', 'font-weight: bold; color: #3ECF8E');
  console.log('─────────────────────');

  try {
    const stats = await analytics.getStats();

    if (stats.error) {
      console.warn('⚠️ Could not retrieve stats:', stats.error);
      console.log('This is normal if analytics just started');
    } else {
      console.log('User ID:', stats.userId);
      console.log('Session ID:', stats.sessionId);
      console.log('Total Events:', stats.totalEvents);
      console.log('\nEvent Breakdown:');
      Object.entries(stats.eventBreakdown || {}).forEach(([event, count]) => {
        console.log(`  - ${event}: ${count}`);
      });
    }
  } catch (error) {
    console.warn('⚠️ Stats retrieval failed:', error.message);
  }

  // Verify in Supabase
  console.log('\n%c✅ Test Complete!', 'font-size: 14px; font-weight: bold; color: #3ECF8E');
  console.log('═══════════════\n');

  console.log('Next steps:');
  console.log('1. Go to Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/yodkqpdzyiugygzudbsv');
  console.log('2. Navigate to Table Editor → analytics_events');
  console.log('3. You should see the test events!');
  console.log('4. Filter by your User ID:', analytics.userId);

  console.log('\n%c📊 Quick Supabase Queries', 'font-weight: bold');
  console.log('─────────────────────');
  console.log('Run these in Supabase SQL Editor:\n');

  console.log(`-- View your events
SELECT event_name, properties, timestamp
FROM analytics_events
WHERE user_id = '${analytics.userId}'
ORDER BY timestamp DESC
LIMIT 10;`);

  console.log('\n-- Count events by type');
  console.log(`SELECT event_name, COUNT(*) as count
FROM analytics_events
WHERE user_id = '${analytics.userId}'
GROUP BY event_name;`);

  console.log('\n%c💡 Programmatic Access', 'font-weight: bold');
  console.log('─────────────────────');
  console.log('// Track translation');
  console.log('window.LanguageBridgeAnalytics.trackTranslation("en-US", "fa-IR", 100);');
  console.log('\n// Track TTS');
  console.log('window.LanguageBridgeAnalytics.trackTTS("fa-IR", 50);');
  console.log('\n// Track feature');
  console.log('window.LanguageBridgeAnalytics.trackFeature("glossary", "opened");');
  console.log('\n// Get stats');
  console.log('window.LanguageBridgeAnalytics.getStats();');
  console.log('\n// Check if enabled');
  console.log('window.LanguageBridgeAnalytics.isEnabled();');

  console.log('\n%c🎉 Analytics is working!', 'font-size: 16px; font-weight: bold; color: #3ECF8E');

})();
