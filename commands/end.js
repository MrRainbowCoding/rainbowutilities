const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { saveServerConfig, serverConfig } = require('../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('End a DM session with a user.  (May not work correctly due to coding issues)')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('User to end conversation with')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, serverConfig, saveServerConfig) {
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;

        // Ensure the guilds and dmThreads objects exist
        if (!serverConfig.guilds[guildId] || !serverConfig.guilds[guildId].dmThreads || !serverConfig.guilds[guildId].dmThreads[user.id]) {
            return await interaction.reply({
                content: '❌ No active DM session found for that user.',
                ephemeral: true
            });
        }

        const guildSettings = serverConfig.guilds[guildId];
        const threadId = guildSettings.dmThreads[user.id];
        const thread = await interaction.guild.channels.fetch(threadId).catch(() => null);

        // Notify the user via DM that the session has ended
        await user.send({
            content: `👋 Your DM session with the staff of **${interaction.guild.name}** has been closed. Any further messages will not be forwarded. To start a new conversation, please use the appropriate command on the server again.`
        }).catch(() => {
            console.log(`Could not DM user ${user.id}, they may have DMs disabled.`);
            if (thread) {
                thread.send({ content: `⚠️ **Could not notify the user via DM.** They may have DMs disabled or have blocked the bot.` });
            }
        });

        // Check if the fetched channel is a thread before attempting to archive it
        if (thread && thread.type === ChannelType.PrivateThread || thread.type === ChannelType.PublicThread) {
            await thread.send(`❌ **Session ended by ${interaction.user.tag}.** This thread will now be archived.`);
            await thread.setArchived(true).catch(() => {});
        } else if (thread) {
            // If it's a valid channel but not a thread, still send the message
            await thread.send(`❌ **Session ended by ${interaction.user.tag}.** The linked conversation channel was not a thread and could not be archived.`);
        }

        // Remove the session data to stop message forwarding
        delete guildSettings.dmThreads[user.id];
        delete guildSettings.dmThreads[threadId];
        saveServerConfig();

        await interaction.reply({
            content: `✅ Session with ${user.tag} has been ended and the user notified.`,
            ephemeral: true
        });
    }
};