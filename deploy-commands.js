const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Get bot token and client ID from environment variables
const token = process.env.DISCORD_TOKEN || 'your_discord_bot_token_here';
const clientId = process.env.CLIENT_ID || 'your_client_id_here';

// Array to store commands
const commands = [];

// Load commands from commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`❌ [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        // Deploy commands globally (this might take up to 1 hour to propagate)
        // For faster testing, you can deploy to a specific guild instead
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
        
        // Optional: Deploy to a specific guild for faster testing
        // Replace 'your_guild_id_here' with your test server's ID
        /*
        const guildId = process.env.GUILD_ID || 'your_guild_id_here';
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        console.log(`✅ Successfully reloaded ${data.length} guild commands for guild ${guildId}.`);
        */
        
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();
