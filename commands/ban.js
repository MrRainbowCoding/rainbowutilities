const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning the user')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        const member = interaction.guild.members.cache.get(user.id);

        // Check if trying to ban yourself
        if (user.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Invalid Action')
                .setDescription('You cannot ban yourself!')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if user is in the server and role hierarchy
        if (member) {
            if (!member.bannable) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Cannot Ban User')
                    .setDescription('I cannot ban this user. They may have higher permissions than me.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Insufficient Permissions')
                    .setDescription('You cannot ban a user with equal or higher role permissions.')
                    .setTimestamp();

                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        try {
            // Send DM to user before banning (if they're in the server)
            if (member) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚨 You have been banned')
                        .setDescription(`You have been banned from **${interaction.guild.name}**`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: interaction.user.tag }
                        )
                        .setTimestamp();

                    await user.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    console.log('Could not send DM to user:', dmError.message);
                }
            }

            // Ban the user
            await interaction.guild.members.ban(user, { 
                reason: reason,
                deleteMessageDays: deleteDays
            });

            // Log the action
            logAction(interaction.guild.id, {
                action: 'BAN',
                moderator: interaction.user.tag,
                user: user.tag,
                reason: reason,
                deleteDays: deleteDays,
                timestamp: new Date().toISOString()
            });

            // Send success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Banned')
                .setDescription(`**${user.tag}** has been banned from the server.`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag },
                    { name: 'Messages Deleted', value: `${deleteDays} days` }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error banning user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Ban Failed')
                .setDescription('An error occurred while trying to ban the user.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
