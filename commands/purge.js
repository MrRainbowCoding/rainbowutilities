const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            
            // Filter messages if user is specified
            let messagesToDelete = messages;
            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
            }

            // Check if messages are older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const oldMessages = messagesToDelete.filter(msg => msg.createdTimestamp < twoWeeksAgo);
            
            if (oldMessages.size > 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Cannot Delete Old Messages')
                    .setDescription(`Cannot delete ${oldMessages.size} messages that are older than 14 days.`)
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Delete messages
            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            // Log the action
            logAction(interaction.guild.id, {
                action: 'PURGE',
                moderator: interaction.user.tag,
                channel: interaction.channel.name,
                amount: deletedMessages.size,
                targetUser: targetUser ? targetUser.tag : 'All users',
                timestamp: new Date().toISOString()
            });

            // Send success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Messages Deleted')
                .setDescription(`Successfully deleted **${deletedMessages.size}** messages.`)
                .addFields(
                    { name: 'Channel', value: interaction.channel.name },
                    { name: 'Moderator', value: interaction.user.tag },
                    { name: 'Target User', value: targetUser ? targetUser.tag : 'All users' }
                )
                .setTimestamp();

            // Send ephemeral response and delete it after 5 seconds
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // Also send a temporary message in the channel
            const tempMessage = await interaction.followUp({ 
                content: `🗑️ **${deletedMessages.size}** messages deleted by ${interaction.user.tag}`,
                ephemeral: false
            });

            // Delete the temporary message after 5 seconds
            setTimeout(async () => {
                try {
                    await tempMessage.delete();
                } catch (error) {
                    console.log('Could not delete temporary message:', error.message);
                }
            }, 5000);

        } catch (error) {
            console.error('Error purging messages:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Purge Failed')
                .setDescription('An error occurred while trying to delete messages.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
