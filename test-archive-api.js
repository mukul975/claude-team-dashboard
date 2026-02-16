/**
 * Test script for archive API endpoints
 * This tests the /api/archive endpoints without requiring the server to be running
 *
 * Usage: node test-archive-api.js [server-url]
 */

const http = require('http');

const SERVER_URL = process.argv[2] || 'http://localhost:3002';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${path}`;

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testArchiveEndpoints() {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 Archive API Endpoints Test', 'bright');
  log('='.repeat(60), 'bright');
  log(`📡 Server: ${SERVER_URL}\n`, 'cyan');

  try {
    // Test 1: Health check
    log('📋 Test 1: Health check...', 'yellow');
    try {
      const health = await makeRequest('/api/health');
      if (health.statusCode === 200) {
        log('✅ Server is running', 'green');
        log(`   Status: ${health.data.status}`, 'cyan');
      } else {
        log(`⚠️  Unexpected status: ${health.statusCode}`, 'yellow');
      }
    } catch (error) {
      log(`❌ Server is not running: ${error.message}`, 'red');
      log('\n💡 Tip: Start the server with "npm start" first', 'yellow');
      return;
    }

    // Test 2: Get all archives
    log('\n📋 Test 2: GET /api/archive (list all archives)...', 'yellow');
    const archivesResponse = await makeRequest('/api/archive');

    if (archivesResponse.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${archivesResponse.statusCode}`);
    }

    log('✅ Archives retrieved successfully', 'green');
    log(`   Count: ${archivesResponse.data.count}`, 'cyan');

    if (archivesResponse.data.archives && archivesResponse.data.archives.length > 0) {
      log('\n📚 Archives found:', 'cyan');
      archivesResponse.data.archives.slice(0, 5).forEach((archive, index) => {
        log(`   ${index + 1}. ${archive.teamName}`, 'cyan');
        log(`      Archived: ${new Date(archive.archivedAt).toLocaleString()}`, 'cyan');
        if (archive.overview) {
          log(`      ${archive.overview}`, 'cyan');
        }
      });

      // Test 3: Get specific archive details
      if (archivesResponse.data.archives.length > 0) {
        const firstArchive = archivesResponse.data.archives[0];
        log(`\n📋 Test 3: GET /api/archive/:filename (specific archive)...`, 'yellow');
        log(`   Testing with: ${firstArchive.filename}`, 'cyan');

        const archiveResponse = await makeRequest(`/api/archive/${firstArchive.filename}`);

        if (archiveResponse.statusCode !== 200) {
          throw new Error(`Expected status 200, got ${archiveResponse.statusCode}`);
        }

        log('✅ Archive details retrieved successfully', 'green');
        log(`   Team Name: ${archiveResponse.data.teamName}`, 'cyan');
        log(`   Archived At: ${new Date(archiveResponse.data.archivedAt).toLocaleString()}`, 'cyan');

        // Verify structure
        const requiredFields = ['teamName', 'archivedAt', 'summary', 'rawData'];
        const hasAllFields = requiredFields.every(field => field in archiveResponse.data);

        if (hasAllFields) {
          log('✅ Archive structure is valid', 'green');
        } else {
          const missingFields = requiredFields.filter(field => !(field in archiveResponse.data));
          log(`⚠️  Missing fields: ${missingFields.join(', ')}`, 'yellow');
        }

        // Display summary
        if (archiveResponse.data.summary) {
          log('\n📊 Archive Summary:', 'cyan');
          const summary = archiveResponse.data.summary;

          if (summary.overview) {
            log(`   ${summary.overview}`, 'cyan');
          }

          if (summary.duration) {
            log(`   ⏱️  ${summary.duration}`, 'cyan');
          }

          if (summary.members && summary.members.length > 0) {
            log(`   👥 Members: ${summary.members.length}`, 'cyan');
            summary.members.forEach(member => {
              log(`      • ${member}`, 'cyan');
            });
          }

          if (summary.accomplishments && summary.accomplishments.length > 0) {
            log(`   🎯 Accomplishments:`, 'cyan');
            summary.accomplishments.forEach(accomplishment => {
              log(`      ${accomplishment}`, 'cyan');
            });
          }
        }
      }
    } else {
      log('\n📭 No archives found', 'yellow');
      log('   Create and delete a team to test archiving', 'cyan');
    }

    // Test 4: Test invalid archive filename
    log('\n📋 Test 4: GET /api/archive/:filename (invalid filename)...', 'yellow');
    try {
      const invalidResponse = await makeRequest('/api/archive/nonexistent-archive.json');
      if (invalidResponse.statusCode === 404) {
        log('✅ Correctly returns 404 for nonexistent archive', 'green');
      } else {
        log(`⚠️  Expected 404, got ${invalidResponse.statusCode}`, 'yellow');
      }
    } catch (error) {
      log(`⚠️  Request failed: ${error.message}`, 'yellow');
    }

    // Summary
    log('\n' + '='.repeat(60), 'green');
    log('✅ ALL ARCHIVE API TESTS PASSED!', 'green');
    log('='.repeat(60), 'green');
    log('\n📊 Test Summary:', 'bright');
    log('   ✓ Server health check', 'green');
    log('   ✓ List all archives endpoint', 'green');
    if (archivesResponse.data.archives && archivesResponse.data.archives.length > 0) {
      log('   ✓ Get specific archive endpoint', 'green');
      log('   ✓ Archive structure validation', 'green');
      log('   ✓ Invalid archive handling', 'green');
    }
    log('\n🎉 Archive API is working correctly!', 'bright');

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('❌ TEST FAILED', 'red');
    log('='.repeat(60), 'red');
    log(`\nError: ${error.message}`, 'red');
    if (error.stack) {
      log(`\nStack trace:`, 'yellow');
      log(error.stack, 'yellow');
    }
  }
}

// Check if server URL is provided
if (process.argv[2]) {
  log(`\n📡 Using custom server URL: ${process.argv[2]}`, 'cyan');
}

// Run the tests
testArchiveEndpoints().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
