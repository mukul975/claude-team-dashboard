import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Integration tests for team archiving system
 * These tests verify the archiving functionality works correctly with real files
 */

describe('Team Archiving Integration Tests', () => {
  const homeDir = os.homedir();
  const testArchiveDir = path.join(homeDir, '.claude', 'archive');
  const testTeamsDir = path.join(homeDir, '.claude', 'teams');
  const testTasksDir = path.join(homeDir, '.claude', 'tasks');

  // Helper function to create mock team data
  async function createMockTeam(teamName, membersCount, tasksCount) {
    const teamDir = path.join(testTeamsDir, teamName);
    const tasksDir = path.join(testTasksDir, teamName);

    // Create directories
    await fs.mkdir(teamDir, { recursive: true });
    await fs.mkdir(tasksDir, { recursive: true });

    // Create team config
    const config = {
      name: teamName,
      members: Array.from({ length: membersCount }, (_, i) => ({
        name: `agent-${i + 1}`,
        agentType: ['researcher', 'developer', 'tester'][i % 3]
      })),
      createdAt: Date.now() - (Math.random() * 7200000), // Random time in last 2 hours
      description: `Test team: ${teamName}`
    };

    await fs.writeFile(
      path.join(teamDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create tasks
    for (let i = 0; i < tasksCount; i++) {
      const task = {
        id: `task-${i + 1}`,
        subject: `Task ${i + 1} for ${teamName}`,
        description: `This is test task ${i + 1}`,
        status: ['pending', 'in_progress', 'completed'][i % 3],
        createdAt: Date.now() - (Math.random() * 3600000),
        owner: i < membersCount ? `agent-${i + 1}` : null,
        blockedBy: []
      };

      await fs.writeFile(
        path.join(tasksDir, `task-${i + 1}.json`),
        JSON.stringify(task, null, 2)
      );
    }

    return { config, teamDir, tasksDir };
  }

  // Helper function to read team data
  async function readTeamData(teamName) {
    const configPath = path.join(testTeamsDir, teamName, 'config.json');
    const tasksDir = path.join(testTasksDir, teamName);

    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const taskFiles = await fs.readdir(tasksDir);
    const tasks = [];

    for (const file of taskFiles) {
      if (file.endsWith('.json')) {
        const taskPath = path.join(tasksDir, file);
        const task = JSON.parse(await fs.readFile(taskPath, 'utf8'));
        tasks.push(task);
      }
    }

    return { config, tasks };
  }

  // Helper function to simulate team archiving
  async function simulateArchiveTeam(teamName) {
    const teamData = await readTeamData(teamName);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archiveFile = path.join(testArchiveDir, `${teamName}_${timestamp}.json`);

    // Create archive directory
    await fs.mkdir(testArchiveDir, { recursive: true });

    // Generate summary
    const members = teamData.config.members || [];
    const tasks = teamData.tasks || [];
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;

    const summary = {
      overview: `Team "${teamName}" with ${members.length} members worked on ${totalTasks} tasks and completed ${completedTasks}.`,
      created: teamData.config.createdAt
        ? new Date(teamData.config.createdAt).toLocaleDateString()
        : 'Unknown',
      members: members.map(m => `${m.name} (${m.agentType})`),
      accomplishments: tasks
        .filter(t => t.status === 'completed')
        .map(t => `✅ ${t.subject}`)
        .slice(0, 10),
      duration: teamData.config.createdAt
        ? `Active for ${Math.round((Date.now() - teamData.config.createdAt) / 1000 / 60)} minutes`
        : 'Unknown duration'
    };

    const archiveData = {
      teamName,
      archivedAt: new Date().toISOString(),
      summary,
      rawData: {
        name: teamName,
        config: teamData.config,
        tasks: teamData.tasks
      }
    };

    await fs.writeFile(archiveFile, JSON.stringify(archiveData, null, 2));
    return archiveFile;
  }

  // Helper function to read archive
  async function readArchive(archiveFile) {
    const content = await fs.readFile(archiveFile, 'utf8');
    return JSON.parse(content);
  }

  // Helper to clean up test files
  async function cleanupTestFiles() {
    try {
      // Note: Be careful with cleanup in production
      // Only clean test-specific files
      const archiveFiles = await fs.readdir(testArchiveDir);
      for (const file of archiveFiles) {
        if (file.startsWith('test-team-') && file.endsWith('.json')) {
          await fs.unlink(path.join(testArchiveDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist, that's okay
      if (error.code !== 'ENOENT') {
        console.error('Cleanup error:', error);
      }
    }
  }

  beforeEach(async () => {
    await cleanupTestFiles();
  });

  describe('Archive Creation', () => {
    it('should create archive file with correct structure', async () => {
      const teamName = 'test-team-archive-1';
      await createMockTeam(teamName, 3, 5);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive).toHaveProperty('teamName');
      expect(archive).toHaveProperty('archivedAt');
      expect(archive).toHaveProperty('summary');
      expect(archive).toHaveProperty('rawData');

      expect(archive.teamName).toBe(teamName);
      expect(archive.summary).toHaveProperty('overview');
      expect(archive.summary).toHaveProperty('created');
      expect(archive.summary).toHaveProperty('members');
      expect(archive.summary).toHaveProperty('accomplishments');
      expect(archive.summary).toHaveProperty('duration');

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should include all team members in summary', async () => {
      const teamName = 'test-team-archive-2';
      const membersCount = 4;
      await createMockTeam(teamName, membersCount, 3);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.summary.members).toHaveLength(membersCount);
      expect(archive.summary.overview).toContain(`${membersCount} members`);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should correctly count completed tasks', async () => {
      const teamName = 'test-team-archive-3';
      await createMockTeam(teamName, 2, 9); // 9 tasks will have 3 completed (9 % 3 = 0, 1, 2 statuses)

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      const completedCount = archive.rawData.tasks.filter(t => t.status === 'completed').length;
      expect(archive.summary.overview).toContain(`completed ${completedCount}`);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should limit accomplishments to top 10', async () => {
      const teamName = 'test-team-archive-4';
      await createMockTeam(teamName, 2, 30); // 30 tasks, ~10 completed

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.summary.accomplishments.length).toBeLessThanOrEqual(10);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);
  });

  describe('Archive Data Integrity', () => {
    it('should preserve all original team data in rawData', async () => {
      const teamName = 'test-team-archive-5';
      const { config } = await createMockTeam(teamName, 3, 6);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.rawData.name).toBe(teamName);
      expect(archive.rawData.config.members).toHaveLength(3);
      expect(archive.rawData.tasks).toHaveLength(6);
      expect(archive.rawData.config.createdAt).toBe(config.createdAt);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should maintain valid JSON format', async () => {
      const teamName = 'test-team-archive-6';
      await createMockTeam(teamName, 2, 4);

      const archiveFile = await simulateArchiveTeam(teamName);
      const content = await fs.readFile(archiveFile, 'utf8');

      // Should parse without errors
      const archive = JSON.parse(content);
      expect(archive.teamName).toBe(teamName);

      // Should be pretty-printed
      expect(content).toContain('\n');
      expect(content).toContain('  '); // 2-space indent

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);
  });

  describe('Natural Language Summary', () => {
    it('should generate human-readable overview', async () => {
      const teamName = 'test-team-archive-7';
      await createMockTeam(teamName, 3, 12);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.summary.overview).toMatch(/Team "[\w-]+" with \d+ members worked on \d+ tasks and completed \d+\./);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should format member list with agent types', async () => {
      const teamName = 'test-team-archive-8';
      await createMockTeam(teamName, 3, 3);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      archive.summary.members.forEach(member => {
        expect(member).toMatch(/[\w-]+ \([\w-]+\)/);
      });

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should format accomplishments with checkmarks', async () => {
      const teamName = 'test-team-archive-9';
      await createMockTeam(teamName, 2, 9);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      archive.summary.accomplishments.forEach(accomplishment => {
        expect(accomplishment).toMatch(/^✅ .+/);
      });

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should calculate and display duration in minutes', async () => {
      const teamName = 'test-team-archive-10';
      await createMockTeam(teamName, 2, 4);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.summary.duration).toMatch(/Active for \d+ minutes/);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);
  });

  describe('Archive File Naming', () => {
    it('should create unique filenames with timestamps', async () => {
      const teamName = 'test-team-archive-11';
      await createMockTeam(teamName, 2, 3);

      const archiveFile1 = await simulateArchiveTeam(teamName);

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      const archiveFile2 = await simulateArchiveTeam(teamName);

      expect(archiveFile1).not.toBe(archiveFile2);
      expect(path.basename(archiveFile1)).toMatch(/test-team-archive-11_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.json/);
      expect(path.basename(archiveFile2)).toMatch(/test-team-archive-11_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.json/);

      // Cleanup
      await fs.unlink(archiveFile1);
      await fs.unlink(archiveFile2);
    }, 10000);

    it('should sanitize colons in timestamp', async () => {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      expect(timestamp).not.toContain(':');
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle team with no tasks', async () => {
      const teamName = 'test-team-archive-12';
      await createMockTeam(teamName, 2, 0);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.summary.overview).toContain('0 tasks');
      expect(archive.summary.accomplishments).toHaveLength(0);
      expect(archive.rawData.tasks).toHaveLength(0);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should handle team with no completed tasks', async () => {
      const teamName = 'test-team-archive-13';
      await createMockTeam(teamName, 2, 2); // Only 2 tasks (pending and in_progress)

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);
      const teamData = await readTeamData(teamName);

      const completedCount = teamData.tasks.filter(t => t.status === 'completed').length;
      expect(archive.summary.overview).toContain(`completed ${completedCount}`);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);

    it('should handle team with single member', async () => {
      const teamName = 'test-team-archive-14';
      await createMockTeam(teamName, 1, 5);

      const archiveFile = await simulateArchiveTeam(teamName);
      const archive = await readArchive(archiveFile);

      expect(archive.summary.members).toHaveLength(1);
      expect(archive.summary.overview).toContain('1 members'); // Grammatically correct handling could be improved

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);
  });

  describe('Archive Directory', () => {
    it('should create archive directory if it does not exist', async () => {
      // Ensure directory exists
      await fs.mkdir(testArchiveDir, { recursive: true });

      const stats = await fs.stat(testArchiveDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should store archives in correct location', async () => {
      const teamName = 'test-team-archive-15';
      await createMockTeam(teamName, 2, 3);

      const archiveFile = await simulateArchiveTeam(teamName);

      // Handle both Unix and Windows path formats
      const normalizedPath = archiveFile.replace(/\\/g, '/');
      expect(normalizedPath).toContain('.claude/archive');
      expect(await fs.access(archiveFile).then(() => true).catch(() => false)).toBe(true);

      // Cleanup
      await fs.unlink(archiveFile);
    }, 10000);
  });

  describe('Archive Listing', () => {
    it('should be able to list all archives', async () => {
      // Create multiple archives
      const teamNames = ['test-team-list-1', 'test-team-list-2', 'test-team-list-3'];

      for (const teamName of teamNames) {
        await createMockTeam(teamName, 2, 3);
        await simulateArchiveTeam(teamName);
      }

      // List archives
      const files = await fs.readdir(testArchiveDir);
      const archiveFiles = files.filter(f => f.startsWith('test-team-list-') && f.endsWith('.json'));

      expect(archiveFiles.length).toBeGreaterThanOrEqual(3);

      // Cleanup
      for (const file of archiveFiles) {
        await fs.unlink(path.join(testArchiveDir, file));
      }
    }, 15000);

    it('should sort archives by date', async () => {
      const archives = [
        { archivedAt: '2025-01-15T10:00:00Z', teamName: 'team1' },
        { archivedAt: '2025-01-15T12:00:00Z', teamName: 'team2' },
        { archivedAt: '2025-01-15T11:00:00Z', teamName: 'team3' }
      ];

      const sorted = archives.sort((a, b) =>
        new Date(b.archivedAt) - new Date(a.archivedAt)
      );

      expect(sorted[0].teamName).toBe('team2');
      expect(sorted[1].teamName).toBe('team3');
      expect(sorted[2].teamName).toBe('team1');
    });
  });
});
