const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkPermissions } = require('./utils/permissions');
const { logAction } = require('./utils/logger');
const { checkSpam, addMessage } = require('./utils/automod');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel] // Needed for DMs
});

// Use these client properties as the single source of truth
client.activeDMs = new Collection();
client.commands = new Collection();

// Load all command files
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

// Register slash commands on ready
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

client.once(Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Set bot presence
    const status = require('./config/status');
    client.user.setPresence({
        status: status.status.presence,
        activities: [{ name: status.status.text, type: status.status.type }]
    });

    // Register commands globally
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const body = [...client.commands.values()].map(cmd => cmd.data.toJSON());
    try {
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body });
        console.log('✅ Slash commands registered.');
    } catch (err) {
        console.error('❌ Failed to register commands:', err);
    }
});

// Slash command handler
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return console.error(`❌ Command "${interaction.commandName}" not found.`);

    try {
        if (!checkPermissions(interaction.member, command.data.name)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Permission Denied')
                .setDescription('You are not allowed to use this command.')
                .setTimestamp();
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        await command.execute(interaction);
    } catch (err) {
        console.error(`❌ Error running ${interaction.commandName}:`, err);
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Command Failed')
            .setDescription('An error occurred while executing the command.')
            .setTimestamp();
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// DM message handler
client.on(Events.MessageCreate, async message => {
    if (!message.guild && !message.author.bot) {
        // Use client.activeDMs to check for a conversation
        const adminId = client.activeDMs.get(message.author.id);
        if (adminId) {
            try {
                const adminUser = await client.users.fetch(adminId);
                await adminUser.send(`📨 **Reply from ${message.author.tag}:**\n\n${message.content}`);
                await message.react('✅'); // Notify user
            } catch (err) {
                console.error('❌ Failed to forward DM reply:', err);
            }
        }
        return;
    }

    // Auto-moderation
    if (message.guild && !message.author.bot) {
        if (message.member.permissions.has('MODERATE_MEMBERS')) return;

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
                console.error('❌ AutoMod error:', err);
            }
        }
    }
});

// Log errors and warnings
client.on(Events.Error, console.error);
client.on(Events.Warn, console.warn);

// Graceful shutdown
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