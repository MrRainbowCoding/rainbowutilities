const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('End an active DM conversation with a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to stop messaging')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const activeDMs = interaction.client.activeDMs;

        if (activeDMs.get(user.id) === interaction.user.id) {
            activeDMs.delete(user.id);
            await interaction.reply({ content: `✅ Ended DM conversation with ${user.tag}.`, ephemeral: true });
        } else {
            await interaction.reply({ content: `⚠️ You are not in a conversation with ${user.tag}.`, ephemeral: true });
        }
    },
};
