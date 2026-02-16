# Testing Guide for Claude Team Dashboard

This guide explains how to test the archiving functionality and other features of the dashboard.

## Test Files Overview

### 1. Unit Tests

#### `test/archiving.test.js`
Unit tests for archiving functions using vitest framework.

**What it tests:**
- Archive team function logic
- Natural language summary generation
- Team lifecycle tracking
- Archive file naming conventions
- Data integrity preservation
- Error handling

**Run with:**
```bash
npm test archiving
```

#### `test/archiving-integration.test.js`
Integration tests that work with real file system operations.

**What it tests:**
- Complete archiving workflow with real files
- Archive creation and structure
- Natural language summary accuracy
- File naming and timestamps
- Archive listing and sorting
- Edge cases (empty teams, no tasks, etc.)

**Run with:**
```bash
npm test archiving-integration
```

**Note:** These tests create temporary team files and archives, then clean them up automatically.

### 2. Manual Test Scripts

#### `test-archiving.js`
Comprehensive end-to-end test script for manual verification.

**What it does:**
1. Creates a test team with realistic data
2. Reads team configuration and tasks
3. Archives the team
4. Verifies archive file structure
5. Displays archive summary in a nice format
6. Lists all archives
7. Cleans up test data (keeps archive for inspection)

**Run with:**
```bash
node test-archiving.js
```

**Output:**
- Colored terminal output with clear test results
- Visual summary of archive contents
- Success/failure indicators for each step

**Example output:**
```
🧪 Team Archiving System Test Suite
============================================================

📋 Test 1: Creating test team...
✅ Created test team: test-archive-1770733615796
   👥 Members: 3
   📋 Tasks: 5

📋 Test 2: Reading team data...
✅ Successfully read team data

... (more tests)

✅ ALL TESTS PASSED!
```

#### `test-archive-api.js`
Tests the REST API endpoints for archives.

**What it tests:**
1. Server health check
2. GET /api/archive (list all archives)
3. GET /api/archive/:filename (get specific archive)
4. Invalid archive handling (404 errors)
5. Response structure validation

**Run with:**
```bash
# Default (assumes server on localhost:3002)
node test-archive-api.js

# Custom server URL
node test-archive-api.js http://localhost:3000
```

**Prerequisites:** Server must be running (`npm start`)

## Running All Tests

### Quick Test (Unit Tests Only)
```bash
npm test
```

### Full Test Suite
```bash
# 1. Run unit tests
npm test

# 2. Run manual archiving test
node test-archiving.js

# 3. Start server (in another terminal)
npm start

# 4. Test API endpoints
node test-archive-api.js
```

## Test Scenarios

### Scenario 1: New Installation
Tests archiving works on a fresh installation.

```bash
# 1. Install dependencies
npm ci

# 2. Run tests
npm test archiving

# 3. Manual verification
node test-archiving.js
```

### Scenario 2: Live Server Testing
Tests archiving with a running server.

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Create test team (this will be manual)
# ... create team via Claude Code ...

# Terminal 2: Delete team to trigger archiving
# ... delete team via Claude Code ...

# Terminal 2: Verify archive was created
node test-archive-api.js
```

### Scenario 3: Archive Recovery
Tests reading and displaying archived data.

```bash
# List all archives
ls ~/.claude/archive/

# View specific archive
cat ~/.claude/archive/team-name_timestamp.json | jq .

# Test via API
curl http://localhost:3002/api/archive | jq .
```

## Expected Results

### Successful Test Output

**Unit Tests:**
```
✓ test/archiving.test.js (25)
  ✓ Team Archiving System (25)
    ✓ archiveTeam (6)
    ✓ generateTeamSummary (4)
    ✓ Archive API Integration (2)
    ... (more tests)

Test Files  1 passed (1)
Tests  25 passed (25)
```

**Manual Test:**
```
✅ ALL TESTS PASSED!

📊 Test Summary:
   ✓ Team creation
   ✓ Data reading
   ✓ Team archiving
   ✓ Archive verification
   ✓ Summary display
   ✓ Archive listing

🎉 The archiving system is working correctly!
```

**API Test:**
```
✅ ALL ARCHIVE API TESTS PASSED!

📊 Test Summary:
   ✓ Server health check
   ✓ List all archives endpoint
   ✓ Get specific archive endpoint
   ✓ Archive structure validation
   ✓ Invalid archive handling

🎉 Archive API is working correctly!
```

## Troubleshooting

### Tests Fail: "Cannot read directory"

**Problem:** Archive or teams directory doesn't exist

**Solution:**
```bash
# Create directories manually
mkdir -p ~/.claude/archive
mkdir -p ~/.claude/teams
mkdir -p ~/.claude/tasks

# Or let the system create them
npm start  # Server creates directories on startup
```

### Tests Fail: "Server not running"

**Problem:** API tests require running server

**Solution:**
```bash
# Start server in another terminal
npm start

# Then run API tests
node test-archive-api.js
```

### Tests Fail: "Permission denied"

**Problem:** Cannot write to .claude directory

**Solution:**
```bash
# Check permissions
ls -la ~/.claude/

# Fix permissions
chmod -R u+w ~/.claude/
```

### Archive Not Created

**Problem:** Team deleted but no archive

**Solution:**
1. Check server is running and watching files
2. Verify team had valid config.json
3. Check server logs for errors
4. Run manual test to verify archiving works:
   ```bash
   node test-archiving.js
   ```

## Continuous Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run manual archiving test
        run: node test-archiving.js

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: coverage/
```

## Test Coverage

Run tests with coverage reporting:

```bash
npm run test:coverage
```

This generates a coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Coverage reports are saved to `coverage/` directory.

## Best Practices

1. **Run tests before commits**
   ```bash
   npm test
   ```

2. **Test new features**
   - Add unit tests for new functions
   - Add integration tests for new workflows
   - Update manual tests for new UI features

3. **Keep tests isolated**
   - Clean up test data after each test
   - Use unique names for test teams/files
   - Don't rely on existing data

4. **Document test scenarios**
   - Add comments explaining what each test does
   - Include expected outcomes
   - Note any prerequisites

5. **Monitor test performance**
   - Keep tests fast (< 10 seconds per test)
   - Use timeouts for async operations
   - Parallelize independent tests

## Related Documentation

- [ARCHIVING.md](ARCHIVING.md) - Archive system documentation
- [README.md](README.md) - Main project documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines (if exists)
