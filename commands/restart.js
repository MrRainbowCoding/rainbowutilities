const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart the bot (admin only).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (interaction.guildId !== '1387805318867718174') {
            await interaction.reply({ content: '❌ This command can only be used in the authorized server.', ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle('🔄 Bot Soft Reload')
            .setDescription('Reloading bot status and slash commands...')
            .setColor(0x5865F2)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });

        // Update bot status from config
        const statusConfig = require('../../config/status');
        interaction.client.user.setPresence({
            status: statusConfig.status.presence,
            activities: [
                {
                    name: statusConfig.status.text,
                    type: statusConfig.status.type
                }
            ]
        });

        // Re-register slash commands
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord.js');
        const commandsData = [];
        for (const command of interaction.client.commands.values()) {
            if (command.data) {
                commandsData.push(command.data.toJSON ? command.data.toJSON() : command.data);
            }
        }
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commandsData }
            );
        } catch (error) {
            console.error('❌ Error reloading slash commands:', error);
        }
    },
};
