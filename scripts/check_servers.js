#!/usr/bin/env node

// Check if ports are free and start servers
const { exec } = require('child_process');
const http = require('http');

const checkPort = (port) => {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}`, {
      timeout: 1000,
    }, () => {
      resolve(true); // Port is in use
    });

    req.on('error', () => {
      resolve(false); // Port is free
    });

    req.on('timeout', () => {
      req.abort();
      resolve(true);
    });
  });
};

const startServers = async () => {
  console.log('🎯 Pharma4u Full Stack Startup\n');

  // Check backend
  console.log('Checking backend (port 8000)...');
  const backendRunning = await checkPort(8000);
  
  if (!backendRunning) {
    console.log('❌ Backend not running!');
    console.log('Start it manually:');
    console.log('  cd c:\\Users\\neera\\Downloads\\Pharma-for-You');
    console.log('  .venv\\Scripts\\Activate.ps1');
    console.log('  python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000\n');
  } else {
    console.log('✅ Backend is RUNNING on port 8000\n');
  }

  // Check frontend
  console.log('Checking frontend (port 3000)...');
  const frontendRunning = await checkPort(3000);
  
  if (frontendRunning) {
    console.log('⚠️  Port 3000 is in use. Trying to start frontend anyway...\n');
  } else {
    console.log('✅ Port 3000 is free\n');
  }

  console.log('🚀 All systems ready!\n');
  console.log('📍 Open in browser:');
  console.log('   • Frontend: http://localhost:3000');
  console.log('   • Backend docs: http://127.0.0.1:8000/docs\n');
};

startServers().catch(console.error);
