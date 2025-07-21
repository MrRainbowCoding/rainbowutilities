const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../configManager'); // Still need getGuildConfig

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

    async execute(interaction, client, serverConfig, saveServerConfig) { // Added parameters
        const targetUser = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        // Use getGuildConfig from configManager, which handles default settings
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

            // Save thread info for reply handling using the passed serverConfig
            if (!serverConfig.guilds[interaction.guildId]) {
                serverConfig.guilds[interaction.guildId] = {};
            }
            if (!serverConfig.guilds[interaction.guildId].dmThreads) {
                serverConfig.guilds[interaction.guildId].dmThreads = {};
            }
            const dmThreads = serverConfig.guilds[interaction.guildId].dmThreads;
            const threadId = logMessage.thread ? logMessage.thread.id : logMessage.channel.id;
            dmThreads[targetUser.id] = threadId;
            dmThreads[threadId] = targetUser.id;
            saveServerConfig(); // Use the passed saveServerConfig function

            await interaction.reply({
                content: `✅ Message sent to ${targetUser.tag}.`,
                ephemeral: true
            });
        } catch (err) {
            console.error('DM Error:', err);
            await interaction.reply({
                content: `❌ Could not send DM to ${targetUser.tag}. They may have DMs disabled.`,
                ephemeral: true
            });
        }
    },
};