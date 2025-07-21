const {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
    EmbedBuilder,
    Partials
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Utils
const { checkPermissions } = require('./utils/permissions');
const { logAction } = require('./utils/logger');
const { checkSpam, addMessage } = require('./utils/automod');

// Settings
const config = require('./data/config.json');
const serverConfigPath = './data/serverConfig.json';
let serverConfig;

// Check if serverConfig.json exists, if not, create it
if (fs.existsSync(serverConfigPath)) {
    serverConfig = require(serverConfigPath);
} else {
    serverConfig = {
        guilds: {}
    };
    fs.writeFileSync(serverConfigPath, JSON.stringify(serverConfig, null, 4));
    console.log('✅ Created serverConfig.json as it did not exist.');
}

function saveServerConfig() {
    fs.writeFileSync(serverConfigPath, JSON.stringify(serverConfig, null, 4));
}

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[WARNING] Command ${file} is missing "data" or "execute".`);
    }
}

// Register slash commands
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Set status
    const status = require('./config/status');
    client.user.setPresence({
        status: status.status.presence,
        activities: [{ name: status.status.text, type: status.status.type }]
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: client.commands.map(c => c.data.toJSON()) }
        );
        console.log('✅ Slash commands registered.');
    } catch (err) {
        console.error('❌ Failed to register commands:', err);
    }
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        if (!checkPermissions(interaction.member, command.data.name)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Permission Denied')
                        .setDescription('You do not have permission to use this command.')
                ],
                ephemeral: true
            });
        }
        // Pass client, serverConfig, and saveServerConfig to the command's execute method
        await command.execute(interaction, client, serverConfig, saveServerConfig);
    } catch (error) {
        console.error(`❌ Error executing ${interaction.commandName}:`, error);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Error')
            .setDescription('An error occurred while executing this command.');

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});

// Handle messages
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // DM from a user
    if (!message.guild) {
        let activeThreadId = null;
        let activeGuildId = null;

        // 1. Search across ALL configured guilds to find an active session for this user
        for (const guildId in serverConfig.guilds) {
            const guildSettings = serverConfig.guilds[guildId];
            if (guildSettings.dmThreads && guildSettings.dmThreads[message.author.id]) {
                activeThreadId = guildSettings.dmThreads[message.author.id];
                activeGuildId = guildId;
                break;
            }
        }

        // 2. If a session was found, forward the message
        if (activeThreadId && activeGuildId) {
            try {
                const thread = await client.channels.fetch(activeThreadId);
                await thread.send(`📨 **${message.author.tag}:** ${message.content}`);
                await message.react('📬');
            } catch (err) {
                console.error(`❌ Failed to forward DM to thread ${activeThreadId}:`, err);
                
                // Cleanup: The thread was likely deleted in Discord.
                const threadMap = serverConfig.guilds[activeGuildId].dmThreads;
                if (threadMap) {
                    delete threadMap[message.author.id];
                    delete threadMap[activeThreadId];
                    saveServerConfig();
                    console.log(`Cleaned up stale thread reference for user ${message.author.id}`);
                }
            }
        } else {
            // 3. If NO session was found after checking all guilds, instruct the user
            await message.reply({
                content: "👋 You don't have an active conversation. To contact staff, please go to the server you need help with and use a command to open a new session."
            }).catch(err => {
                console.error(`❌ Could not reply to user ${message.author.id} in DMs:`, err);
            });
        }
        return;
    }

    // Message from a thread (admin reply)
    if (message.channel.isThread()) {
        const guildId = message.guild.id;
        const threadId = message.channel.id;
        const userId = serverConfig.guilds[guildId]?.dmThreads?.[threadId];

        if (userId) {
            try {
                const user = await client.users.fetch(userId);
                await user.send(`📩 **Reply from ${message.author.tag}:** ${message.content}`);
                await message.react('✅');
            } catch (err) {
                console.error('❌ Failed to send admin reply:', err);
            }
        }
    }

    // AutoMod
    const guildSettings = serverConfig.guilds[message.guild.id] || config.defaultSettings;
    if (!guildSettings.autoMod?.enabled) return;
    if (message.member?.permissions.has('MODERATE_MEMBERS')) return;

    addMessage(message.author.id, message.content);
    if (checkSpam(message.author.id)) {
        try {
            await message.delete();
            await message.member.timeout(5 * 60 * 1000, 'AutoMod: Spam detected');

            logAction(message.guild.id, {
                action: 'AUTO_TIMEOUT',
                moderator: client.user.tag,
                user: message.author.tag,
                reason: 'Spam',
                timestamp: new Date().toISOString()
            });

            const spamEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚨 Spam Detected')
                .setDescription(`${message.author}, you were timed out for spamming.`)
                .setTimestamp();

            await message.channel.send({ embeds: [spamEmbed] });
        } catch (err) {
            console.error('❌ AutoMod Error:', err);
        }
    }
});

// Handle shutdown
const gracefulShutdown = async () => {
    if (client.user) {
        console.log('Logging out...');
        await client.destroy();
    }
};

process.on('SIGINT', () => gracefulShutdown().then(() => process.exit(0)));
process.on('SIGTERM', () => gracefulShutdown().then(() => process.exit(0)));
process.on('beforeExit', gracefulShutdown);

client.login(process.env.DISCORD_TOKEN);