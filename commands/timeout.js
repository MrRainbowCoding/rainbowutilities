const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user in the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (max 40320 - 4 weeks)')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timing out the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
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

        // Check if user is moderatable
        if (!member.moderatable) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Cannot Timeout User')
                .setDescription('I cannot timeout this user. They may have higher permissions than me.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if trying to timeout yourself
        if (user.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Invalid Action')
                .setDescription('You cannot timeout yourself!')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You cannot timeout a user with equal or higher role permissions.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if user is already timed out
        if (member.communicationDisabledUntil && member.communicationDisabledUntil > Date.now()) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ User Already Timed Out')
                .setDescription('This user is already timed out.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Calculate timeout duration in milliseconds
            const timeoutDuration = duration * 60 * 1000;

            // Send DM to user before timing out
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🚨 You have been timed out')
                    .setDescription(`You have been timed out in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Duration', value: `${duration} minutes` },
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('Could not send DM to user:', dmError.message);
            }

            // Timeout the user
            await member.timeout(timeoutDuration, reason);

            // Log the action
            logAction(interaction.guild.id, {
                action: 'TIMEOUT',
                moderator: interaction.user.tag,
                user: user.tag,
                reason: reason,
                duration: `${duration} minutes`,
                timestamp: new Date().toISOString()
            });

            // Send success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Timed Out')
                .setDescription(`**${user.tag}** has been timed out.`)
                .addFields(
                    { name: 'Duration', value: `${duration} minutes` },
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error timing out user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Timeout Failed')
                .setDescription('An error occurred while trying to timeout the user.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
