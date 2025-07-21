const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// No need to import serverConfig or saveServerConfig from configManager here, as they are passed
// const { saveServerConfig, serverConfig } = require('../configManager'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('End a DM session with a user.')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('User to end conversation with')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, serverConfig, saveServerConfig) { // Added parameters
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        const guildSettings = serverConfig.guilds[guildId]; // Use the passed serverConfig

        if (!guildSettings || !guildSettings.dmThreads || !guildSettings.dmThreads[user.id]) {
            return await interaction.reply({
                content: '❌ No active DM session found for that user.',
                ephemeral: true
            });
        }

        const threadId = guildSettings.dmThreads[user.id];
        const thread = await interaction.guild.channels.fetch(threadId).catch(() => null);

        // --- Start of new/modified code ---

        // 1. Notify the user via DM that the session has ended
        await user.send({
            content: `👋 Your DM session with the staff of **${interaction.guild.name}** has been closed. Any further messages will not be forwarded. To start a new conversation, please use the appropriate command on the server again.`
        }).catch(() => {
            console.log(`Could not DM user ${user.id}, they may have DMs disabled.`);
            if (thread) {
                thread.send({ content: `⚠️ **Could not notify the user via DM.** They may have DMs disabled or have blocked the bot.` });
            }
        });

        // 2. Notify the staff in the thread and archive it
        if (thread) {
            await thread.send(`❌ **Session ended by ${interaction.user.tag}.** This thread will now be archived.`);
            await thread.setArchived(true).catch(() => {});
        }

        // 3. Remove the session data to stop message forwarding
        delete guildSettings.dmThreads[user.id];
        delete guildSettings.dmThreads[threadId];
        saveServerConfig(); // Use the passed saveServerConfig function

        await interaction.reply({
            content: `✅ Session with ${user.tag} has been ended and the user notified.`,
            ephemeral: true
        });

        // --- End of new/modified code ---
    }
};