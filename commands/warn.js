const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Load warnings data
const warningsPath = path.join(__dirname, '../data/warnings.json');
let warnings = {};

try {
    if (fs.existsSync(warningsPath)) {
        warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
    }
} catch (error) {
    console.error('Error loading warnings:', error);
    warnings = {};
}

// Save warnings to file
function saveWarnings() {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('Error saving warnings:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning the user')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
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

        // Check if trying to warn yourself
        if (user.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Invalid Action')
                .setDescription('You cannot warn yourself!')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Insufficient Permissions')
                .setDescription('You cannot warn a user with equal or higher role permissions.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Initialize user warnings if not exists
            if (!warnings[user.id]) {
                warnings[user.id] = [];
            }

            // Add warning
            const warning = {
                id: Date.now().toString(),
                reason: reason,
                moderator: interaction.user.tag,
                timestamp: new Date().toISOString(),
                guildId: interaction.guild.id
            };

            warnings[user.id].push(warning);
            saveWarnings();

            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle('⚠️ You have been warned')
                    .setDescription(`You have been warned in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag },
                        { name: 'Warning Count', value: warnings[user.id].length.toString() }
                    )
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log('Could not send DM to user:', dmError.message);
            }

            // Log the action
            logAction(interaction.guild.id, {
                action: 'WARN',
                moderator: interaction.user.tag,
                user: user.tag,
                reason: reason,
                warningCount: warnings[user.id].length,
                timestamp: new Date().toISOString()
            });

            // Send success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0xFFFF00)
                .setTitle('⚠️ User Warned')
                .setDescription(`**${user.tag}** has been warned.`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag },
                    { name: 'Total Warnings', value: warnings[user.id].length.toString() }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

            // Auto-moderation based on warning count
            const warningCount = warnings[user.id].length;
            if (warningCount >= 3) {
                try {
                    // Timeout user for 1 hour after 3 warnings
                    await member.timeout(60 * 60 * 1000, `Auto-timeout: ${warningCount} warnings`);
                    
                    const autoModEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🚨 Auto-Moderation')
                        .setDescription(`${user.tag} has been automatically timed out for 1 hour due to reaching ${warningCount} warnings.`)
                        .setTimestamp();

                    await interaction.followUp({ embeds: [autoModEmbed] });
                } catch (autoModError) {
                    console.error('Auto-moderation error:', autoModError);
                }
            }

        } catch (error) {
            console.error('Error warning user:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Warning Failed')
                .setDescription('An error occurred while trying to warn the user.')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
