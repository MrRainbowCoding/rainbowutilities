const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(user.id);

        // Check if user exists in the server
        if (!member) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ User Not Found')
                .setDescription('The specified user is not in this server.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if user is kickable
        if (!member.kickable) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Cannot Kick User')
                .setDescription('I cannot kick this user. They may have higher permissions than me.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if trying to kick yourself
        if (user.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Invalid Action')
                .setDescription('You cannot kick yourself!')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You cannot kick a user with equal or higher role permissions.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Send DM to user before kicking
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🚨 You have been kicked')
                    .setDescription(`You have been kicked from **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('Could not send DM to user:', dmError.message);
            }

            // Kick the user
            await member.kick(reason);

            // Log the action
            logAction(interaction.guild.id, {
                action: 'KICK',
                moderator: interaction.user.tag,
                user: user.tag,
                reason: reason,
                timestamp: new Date().toISOString()
            });

            // Send success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Kicked')
                .setDescription(`**${user.tag}** has been kicked from the server.`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error kicking user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Kick Failed')
                .setDescription('An error occurred while trying to kick the user.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
