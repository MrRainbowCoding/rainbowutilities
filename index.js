const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkPermissions } = require('./utils/permissions');
const { logAction } = require('./utils/logger');
const { checkSpam, addMessage } = require('./utils/automod');

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

// Collection to store commands
client.commands = new Collection();

// Load commands from commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Bot ready event
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    
    // Set bot status
    client.user.setActivity('for rule violations', { type: 'WATCHING' });
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        // Check if user has permission to use moderation commands
        if (!checkPermissions(interaction.member, command.data.name)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You do not have permission to use this command.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Error executing command ${interaction.commandName}:`, error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ Command Error')
            .setDescription('There was an error while executing this command!')
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Auto-moderation system
client.on(Events.MessageCreate, async message => {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;

    // Skip if user has moderation permissions
    if (message.member.permissions.has('MODERATE_MEMBERS')) return;

    // Add message to spam detection
    addMessage(message.author.id, message.content);

    // Check for spam
    if (checkSpam(message.author.id)) {
        try {
            // Delete the message
            await message.delete();

            // Timeout user for 5 minutes
            await message.member.timeout(5 * 60 * 1000, 'Auto-moderation: Spam detected');

            // Log the action
            logAction(message.guild.id, {
                action: 'AUTO_TIMEOUT',
                moderator: client.user.tag,
                user: message.author.tag,
                reason: 'Spam detected',
                timestamp: new Date().toISOString()
            });

            // Send warning to user
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚨 Auto-Moderation')
                .setDescription(`${message.author}, you have been timed out for spam detection.`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Auto-moderation error:', error);
        }
    }
});

// Handle bot errors
client.on(Events.Error, error => {
    console.error('Discord client error:', error);
});

client.on(Events.Warn, warning => {
    console.warn('Discord client warning:', warning);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN || 'your_discord_bot_token_here';
client.login(token);
