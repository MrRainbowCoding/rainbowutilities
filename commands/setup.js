const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuildConfig } = require('../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the bot settings for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option
                .setName('dm-log')
                .setDescription('The channel where DMs will be logged')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    async execute(interaction) {
        const logChannel = interaction.options.getChannel('dm-log');
        setGuildConfig(interaction.guildId, { logChannel: logChannel.id });

        await interaction.reply({
            content: `✅ DM log channel has been set to ${logChannel}`,
            ephemeral: true
        });
    }
};
