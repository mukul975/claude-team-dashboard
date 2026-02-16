/**
 * Manual test script for team archiving functionality
 * Run this to manually verify the archiving system works correctly
 *
 * Usage: node test-archiving.js
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const TEAMS_DIR = path.join(homeDir, '.claude', 'teams');
const TASKS_DIR = path.join(homeDir, '.claude', 'tasks');
const ARCHIVE_DIR = path.join(homeDir, '.claude', 'archive');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Archive team data
async function archiveTeam(teamName, teamData) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archiveFile = path.join(ARCHIVE_DIR, `${teamName}_${timestamp}.json`);

    // Ensure archive directory exists
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });

    // Create natural language summary
    const summary = {
      teamName,
      archivedAt: new Date().toISOString(),
      summary: generateTeamSummary(teamData),
      rawData: teamData
    };

    await fs.writeFile(archiveFile, JSON.stringify(summary, null, 2));
    log(`✅ Team archived: ${teamName}`, 'green');
    log(`   📁 Location: ${archiveFile}`, 'cyan');

    return archiveFile;
  } catch (error) {
    log(`❌ Error archiving team ${teamName}: ${error.message}`, 'red');
    throw error;
  }
}

// Generate natural language summary
function generateTeamSummary(teamData) {
  const members = teamData.config?.members || [];
  const tasks = teamData.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  const createdDate = teamData.config?.createdAt
    ? new Date(teamData.config.createdAt).toLocaleDateString()
    : 'Unknown';

  return {
    overview: `Team "${teamData.name}" with ${members.length} members worked on ${totalTasks} tasks and completed ${completedTasks}.`,
    created: `Started on ${createdDate}`,
    members: members.map(m => `${m.name} (${m.agentType})`),
    accomplishments: tasks
      .filter(t => t.status === 'completed')
      .map(t => `✅ ${t.subject}`)
      .slice(0, 10),
    duration: teamData.config?.createdAt
      ? `Active for ${Math.round((Date.now() - teamData.config.createdAt) / 1000 / 60)} minutes`
      : 'Unknown duration'
  };
}

// Read team configuration
async function readTeamConfig(teamName) {
  try {
    const configPath = path.join(TEAMS_DIR, teamName, 'config.json');
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log(`⚠️  Error reading team config: ${error.message}`, 'yellow');
    return null;
  }
}

// Read all tasks for a team
async function readTasks(teamName) {
  try {
    const tasksPath = path.join(TASKS_DIR, teamName);
    const files = await fs.readdir(tasksPath);

    const tasks = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const taskPath = path.join(tasksPath, file);
          const data = await fs.readFile(taskPath, 'utf8');
          const task = JSON.parse(data);
          tasks.push({ ...task, id: path.basename(file, '.json') });
        } catch (error) {
          log(`⚠️  Error reading task file ${file}: ${error.message}`, 'yellow');
        }
      }
    }

    return tasks.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } catch (error) {
    log(`⚠️  Error reading tasks: ${error.message}`, 'yellow');
    return [];
  }
}

// List all archived teams
async function listArchives() {
  try {
    const files = await fs.readdir(ARCHIVE_DIR);
    const archives = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(ARCHIVE_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        archives.push({
          filename: file,
          ...data.summary,
          archivedAt: data.archivedAt
        });
      }
    }

    archives.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    return archives;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Create a test team
async function createTestTeam() {
  const teamName = `test-archive-${Date.now()}`;
  const teamDir = path.join(TEAMS_DIR, teamName);
  const tasksDir = path.join(TASKS_DIR, teamName);

  log('\n📝 Creating test team...', 'cyan');

  // Create directories
  await fs.mkdir(teamDir, { recursive: true });
  await fs.mkdir(tasksDir, { recursive: true });

  // Create team config
  const config = {
    name: teamName,
    members: [
      { name: 'team-lead', agentType: 'team-lead' },
      { name: 'researcher', agentType: 'researcher' },
      { name: 'developer', agentType: 'developer' }
    ],
    createdAt: Date.now() - 3600000, // 1 hour ago
    description: 'Test team for archiving verification'
  };

  await fs.writeFile(
    path.join(teamDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );

  // Create test tasks
  const taskData = [
    { subject: 'Research database schema', status: 'completed' },
    { subject: 'Design API endpoints', status: 'completed' },
    { subject: 'Implement user authentication', status: 'completed' },
    { subject: 'Write unit tests', status: 'in_progress' },
    { subject: 'Deploy to staging', status: 'pending' }
  ];

  for (let i = 0; i < taskData.length; i++) {
    const task = {
      id: `task-${i + 1}`,
      ...taskData[i],
      description: `Test task ${i + 1}`,
      createdAt: Date.now() - (3000000 - i * 100000),
      owner: config.members[i % 3].name,
      blockedBy: []
    };

    await fs.writeFile(
      path.join(tasksDir, `task-${i + 1}.json`),
      JSON.stringify(task, null, 2)
    );
  }

  log(`✅ Created test team: ${teamName}`, 'green');
  log(`   👥 Members: ${config.members.length}`, 'cyan');
  log(`   📋 Tasks: ${taskData.length}`, 'cyan');

  return teamName;
}

// Clean up test team
async function cleanupTestTeam(teamName) {
  try {
    const teamDir = path.join(TEAMS_DIR, teamName);
    const tasksDir = path.join(TASKS_DIR, teamName);

    await fs.rm(teamDir, { recursive: true, force: true });
    await fs.rm(tasksDir, { recursive: true, force: true });

    log(`✅ Cleaned up test team: ${teamName}`, 'green');
  } catch (error) {
    log(`⚠️  Error cleaning up: ${error.message}`, 'yellow');
  }
}

// Display archive summary
function displayArchiveSummary(archive) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`📦 Archive: ${archive.filename}`, 'bright');
  log('='.repeat(60), 'cyan');
  log(`📅 Archived: ${new Date(archive.archivedAt).toLocaleString()}`, 'cyan');
  log(`\n${archive.overview}`, 'blue');
  log(`\n⏱️  ${archive.duration}`, 'yellow');
  log(`📅 ${archive.created}`, 'yellow');

  log('\n👥 Team Members:', 'green');
  archive.members.forEach(member => {
    log(`   • ${member}`, 'cyan');
  });

  if (archive.accomplishments && archive.accomplishments.length > 0) {
    log('\n🎯 Accomplishments:', 'green');
    archive.accomplishments.forEach(accomplishment => {
      log(`   ${accomplishment}`, 'cyan');
    });
  } else {
    log('\n🎯 Accomplishments: None completed', 'yellow');
  }

  log('='.repeat(60), 'cyan');
}

// Main test function
async function runTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 Team Archiving System Test Suite', 'bright');
  log('='.repeat(60), 'bright');

  let testTeamName = null;
  let archiveFile = null;

  try {
    // Test 1: Create test team
    log('\n📋 Test 1: Creating test team...', 'yellow');
    testTeamName = await createTestTeam();

    // Test 2: Read team data
    log('\n📋 Test 2: Reading team data...', 'yellow');
    const config = await readTeamConfig(testTeamName);
    const tasks = await readTasks(testTeamName);

    if (!config) {
      throw new Error('Failed to read team config');
    }

    log(`✅ Successfully read team data`, 'green');
    log(`   Team: ${config.name}`, 'cyan');
    log(`   Members: ${config.members.length}`, 'cyan');
    log(`   Tasks: ${tasks.length}`, 'cyan');

    // Test 3: Archive team
    log('\n📋 Test 3: Archiving team...', 'yellow');
    const teamData = {
      name: testTeamName,
      config,
      tasks
    };

    archiveFile = await archiveTeam(testTeamName, teamData);

    // Test 4: Verify archive file
    log('\n📋 Test 4: Verifying archive file...', 'yellow');
    const archiveContent = await fs.readFile(archiveFile, 'utf8');
    const archiveData = JSON.parse(archiveContent);

    // Verify structure
    const requiredFields = ['teamName', 'archivedAt', 'summary', 'rawData'];
    const missingFields = requiredFields.filter(field => !archiveData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    log(`✅ Archive structure is valid`, 'green');

    // Verify summary fields
    const summaryFields = ['overview', 'created', 'members', 'accomplishments', 'duration'];
    const missingSummaryFields = summaryFields.filter(field => !archiveData.summary[field]);

    if (missingSummaryFields.length > 0) {
      throw new Error(`Missing summary fields: ${missingSummaryFields.join(', ')}`);
    }

    log(`✅ Summary structure is valid`, 'green');

    // Verify data integrity
    if (archiveData.teamName !== testTeamName) {
      throw new Error('Team name mismatch in archive');
    }

    if (archiveData.rawData.config.members.length !== config.members.length) {
      throw new Error('Member count mismatch in archive');
    }

    if (archiveData.rawData.tasks.length !== tasks.length) {
      throw new Error('Task count mismatch in archive');
    }

    log(`✅ Data integrity verified`, 'green');

    // Test 5: Display archive
    log('\n📋 Test 5: Displaying archive summary...', 'yellow');
    displayArchiveSummary({
      filename: path.basename(archiveFile),
      ...archiveData.summary,
      archivedAt: archiveData.archivedAt
    });

    // Test 6: List all archives
    log('\n📋 Test 6: Listing all archives...', 'yellow');
    const archives = await listArchives();
    log(`✅ Found ${archives.length} archived team(s)`, 'green');

    if (archives.length > 0) {
      log('\n📚 Recent Archives:', 'cyan');
      archives.slice(0, 5).forEach((archive, index) => {
        log(`   ${index + 1}. ${archive.teamName} - ${new Date(archive.archivedAt).toLocaleString()}`, 'cyan');
      });
    }

    // Summary
    log('\n' + '='.repeat(60), 'green');
    log('✅ ALL TESTS PASSED!', 'green');
    log('='.repeat(60), 'green');
    log('\n📊 Test Summary:', 'bright');
    log('   ✓ Team creation', 'green');
    log('   ✓ Data reading', 'green');
    log('   ✓ Team archiving', 'green');
    log('   ✓ Archive verification', 'green');
    log('   ✓ Summary display', 'green');
    log('   ✓ Archive listing', 'green');
    log('\n🎉 The archiving system is working correctly!', 'bright');

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('❌ TEST FAILED', 'red');
    log('='.repeat(60), 'red');
    log(`\nError: ${error.message}`, 'red');
    if (error.stack) {
      log(`\nStack trace:`, 'yellow');
      log(error.stack, 'yellow');
    }
  } finally {
    // Cleanup
    if (testTeamName) {
      log('\n🧹 Cleaning up test team...', 'yellow');
      await cleanupTestTeam(testTeamName);
    }

    // Note: We keep the archive file for manual inspection
    if (archiveFile) {
      log('\n📝 Note: Archive file preserved for inspection:', 'cyan');
      log(`   ${archiveFile}`, 'cyan');
    }
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
