const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a direct message to a user as an admin.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to DM')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, serverConfig, saveServerConfig) {
        const targetUser = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const config = getGuildConfig(interaction.guildId);

        // Validate log channel setup
        if (!config.logChannel) {
            return await interaction.reply({
                content: '❌ This server has no DM log channel configured. Please use `/setup`.',
                ephemeral: true
            });
        }

        const logChannel = await interaction.guild.channels.fetch(config.logChannel).catch(() => null);
        if (!logChannel || !logChannel.isTextBased()) {
            return await interaction.reply({
                content: '❌ Failed to fetch the DM log channel. Please check permissions.',
                ephemeral: true
            });
        }

        try {
            // Send DM to the user
            await targetUser.send(`📩 **Message from ${interaction.guild.name} admin:**\n\n${message}`);

            // Log to server
            const logEmbed = new EmbedBuilder()
                .setTitle('📨 DM Sent')
                .addFields(
                    { name: 'To', value: `${targetUser.tag} (${targetUser.id})` },
                    { name: 'From Admin', value: `${interaction.user.tag}` },
                    { name: 'Message', value: message }
                )
                .setColor('Blue')
                .setTimestamp();

            const logMessage = await logChannel.send({ embeds: [logEmbed] });

            // Create a thread for the DM
            const dmThread = await logMessage.startThread({
                name: `DM with ${targetUser.tag}`,
                autoArchiveDuration: 60,
                reason: `DM session with ${targetUser.tag}`
            });

            await interaction.reply({
                content: `✅ Message sent to ${targetUser.tag}. The conversation has been started in <#${dmThread.id}>.`,
                ephemeral: true
            });
            
            // Save thread info for reply handling
            if (!serverConfig.guilds[interaction.guildId]) {
                serverConfig.guilds[interaction.guildId] = {};
            }
            if (!serverConfig.guilds[interaction.guildId].dmThreads) {
                serverConfig.guilds[interaction.guildId].dmThreads = {};
            }
            const dmThreads = serverConfig.guilds[interaction.guildId].dmThreads;
            // Map the user ID to the new thread ID and the thread ID back to the user ID
            dmThreads[targetUser.id] = dmThread.id;
            dmThreads[dmThread.id] = targetUser.id;
            saveServerConfig();
            
        } catch (err) {
            console.error('DM Error:', err);
            await interaction.reply({
                content: `❌ Could not send DM to ${targetUser.tag}. They may have DMs disabled.`,
                ephemeral: true
            });
        }
    },
};