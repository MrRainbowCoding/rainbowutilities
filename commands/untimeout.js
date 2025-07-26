const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        }

        try {
            await member.timeout(null); // Passing null removes timeout
            await interaction.reply(`${user.tag} has been removed from timeout.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to remove timeout. Check permissions and bot role position.', ephemeral: true });
        }
    },
};
