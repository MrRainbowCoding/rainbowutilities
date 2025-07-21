const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '.', 'data', 'config.json');
const serverConfigPath = path.join(__dirname, '.', 'data', 'serverConfig.json');

let config;
let serverConfig;

// Load config.json
try {
    config = require(configPath);
} catch (err) {
    console.error('❌ Failed to load config.json. Please ensure the file exists and is valid JSON.', err);
    process.exit(1);
}

// Load or create serverConfig.json
if (fs.existsSync(serverConfigPath)) {
    serverConfig = require(serverConfigPath);
} else {
    serverConfig = { guilds: {} };
    fs.writeFileSync(serverConfigPath, JSON.stringify(serverConfig, null, 4));
    console.log('✅ Created serverConfig.json as it did not exist.');
}

function getGuildConfig(guildId) {
    return serverConfig.guilds[guildId] || config.defaultSettings;
}

function saveServerConfig() {
    fs.writeFileSync(serverConfigPath, JSON.stringify(serverConfig, null, 4));
}
function getDmThreads() {
    return serverConfig.guilds;
}
module.exports = {
    getGuildConfig,
    saveServerConfig, // Export saveServerConfig for use in index.js
    config, // Export config for default settings in index.js
    serverConfig, // Export serverConfig for direct access in index.js
    getDmThreads // Export getDmThreads for use in other modules
};