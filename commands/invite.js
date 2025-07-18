const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Create a single-use, never-expiring invite for this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),
    async execute(interaction) {
        try {
            const invite = await interaction.channel.createInvite({
                maxUses: 1,
                maxAge: 0, // 0 means never expires
                unique: true,
                reason: `Invite created by ${interaction.user.tag}`
            });
            await interaction.reply({ content: `🔗 Here is your single-use invite: ${invite.url}`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: '❌ Failed to create invite. Make sure I have permission.', ephemeral: true });
        }
    },
};
