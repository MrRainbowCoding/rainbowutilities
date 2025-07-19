const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const message = interaction.options.getString('message');

        try {
            await targetUser.send(`📩 **Message from an admin:**\n\n${message}`);
            await interaction.reply({ content: `✅ Message sent to ${targetUser.tag}.`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: `❌ Could not send DM to ${targetUser.tag}. They may have DMs disabled.`, ephemeral: true });
        }
    },
};
