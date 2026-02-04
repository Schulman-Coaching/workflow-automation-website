const axios = require('axios');

const SERVICES = {
  CORE: process.env.CORE_API_URL || 'http://localhost:3001/api/v1',
  INBOX: process.env.INBOXPILOT_API_URL || 'http://localhost:3002/api/v1',
  CHAT: process.env.CHATFLOW_API_URL || 'http://localhost:3004/api/v1',
  CALENDAR: process.env.CALENDAR_API_URL || 'http://localhost:3006/api/v1',
};

async function checkPlatformHealth() {
  console.log('📡 FlowStack Platform Health Check...');
  console.log('-----------------------------------');

  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const start = Date.now();
      const response = await axios.get(`${url}/health`);
      const latency = Date.now() - start;
      
      console.log(`✅ ${name.padEnd(8)} | Status: ${response.status} | Latency: ${latency}ms | URL: ${url}`);
    } catch (error) {
      console.log(`❌ ${name.padEnd(8)} | Status: FAILED | Error: ${error.message} | URL: ${url}`);
    }
  }

  console.log('-----------------------------------');
  console.log('Done.');
}

checkPlatformHealth();
