require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSchemaAndSeeds } = require('./database/schemaInit');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check and initialize database schema & seeds
    await initSchemaAndSeeds();

    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  CaafimaadHub Platform Backend Server`);
      console.log(`  Community Health Volunteer Coordination Platform`);
      console.log(`  Running on: http://localhost:${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Server Startup Error]', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
