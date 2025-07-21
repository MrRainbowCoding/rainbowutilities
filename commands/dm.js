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

        // It's good practice to check if the target is a bot.
        if (targetUser.bot) {
            return interaction.reply({ content: "❌ You cannot DM a bot.", ephemeral: true });
        }

        try {
            // First, attempt to send the DM. Including the guild name is helpful context for the user.
            await targetUser.send(`📩 **Message from an admin of ${interaction.guild.name}:**\n\n${message}`);
        } catch (error) {
            // If sending fails, reply with an error and stop the command.
            console.error(`Could not send DM to ${targetUser.tag}.`, error);
            return interaction.reply({ content: `❌ Could not send DM to ${targetUser.tag}. They may have DMs disabled or have blocked the bot.`, ephemeral: true });
        }

        // If the DM was sent successfully, proceed with other logic.
        try {
            // This assumes you have a custom DM tracking system.
            // Ensure you have initialized `client.activeDMs` in your bot's main file.
            interaction.client.activeDMs.set(targetUser.id, interaction.user.id);
        } catch (e) {
            // Log this error but don't stop the command, as the primary goal (sending the DM) was successful.
            console.error("DM tracking setup failed. Is `client.activeDMs` initialized?", e);
        }
        
        // Finally, confirm to the command user that the message was sent.
        await interaction.reply({ content: `✅ Message sent to ${targetUser.tag}.`, ephemeral: true });
    },
};