const { execSync } = require('child_process');

console.log('Cleaning up running processes...\n');

// Kill processes on port 3001 (backend)
try {
  console.log('Checking port 3001...');
  const netstatOutput = execSync('netstat -ano | findstr :3001', { encoding: 'utf8' });

  const lines = netstatOutput.split('\n').filter(line => line.trim());
  const pids = new Set();

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid) && pid !== '0') {
      pids.add(pid);
    }
  });

  pids.forEach(pid => {
    try {
      console.log(`Killing process ${pid} on port 3001...`);
      execSync(`powershell -Command "Stop-Process -Id ${pid} -Force"`, { stdio: 'ignore' });
      console.log(`✓ Process ${pid} terminated`);
    } catch (err) {
      console.log(`× Could not kill process ${pid} (may have already stopped)`);
    }
  });

  if (pids.size === 0) {
    console.log('✓ Port 3001 is free');
  }
} catch (err) {
  console.log('✓ Port 3001 is free');
}

// Kill processes on port 5173-5175 (frontend)
[5173, 5174, 5175].forEach(port => {
  try {
    console.log(`\nChecking port ${port}...`);
    const netstatOutput = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });

    const lines = netstatOutput.split('\n').filter(line => line.trim());
    const pids = new Set();

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && pid !== '0') {
        pids.add(pid);
      }
    });

    pids.forEach(pid => {
      try {
        console.log(`Killing process ${pid} on port ${port}...`);
        execSync(`powershell -Command "Stop-Process -Id ${pid} -Force"`, { stdio: 'ignore' });
        console.log(`✓ Process ${pid} terminated`);
      } catch (err) {
        console.log(`× Could not kill process ${pid} (may have already stopped)`);
      }
    });

    if (pids.size === 0) {
      console.log(`✓ Port ${port} is free`);
    }
  } catch (err) {
    console.log(`✓ Port ${port} is free`);
  }
});

console.log('\n✓ Cleanup complete! You can now run "npm start"\n');
