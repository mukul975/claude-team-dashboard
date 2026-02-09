const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Claude Agent Dashboard...\n');

// Start backend server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start frontend dev server
const client = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.kill();
  client.kill();
  process.exit();
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

client.on('error', (error) => {
  console.error('Client error:', error);
});

console.log('Backend server starting on http://localhost:3001');
console.log('Frontend dashboard starting on http://localhost:5173');
console.log('\nPress Ctrl+C to stop both servers\n');
