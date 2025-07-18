const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
        .setName('warnings')
        .setDescription('Manage user warnings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to view warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to clear warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove warning from')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('warning_id')
                        .setDescription('The ID of the warning to remove')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        switch (subcommand) {
            case 'view':
                await this.viewWarnings(interaction, user);
                break;
            case 'clear':
                await this.clearWarnings(interaction, user);
                break;
            case 'remove':
                await this.removeWarning(interaction, user);
                break;
        }
    },

    async viewWarnings(interaction, user) {
        const userWarnings = warnings[user.id] || [];
        const guildWarnings = userWarnings.filter(w => w.guildId === interaction.guild.id);

        if (guildWarnings.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📋 User Warnings')
                .setDescription(`**${user.tag}** has no warnings in this server.`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('📋 User Warnings')
            .setDescription(`**${user.tag}** has **${guildWarnings.length}** warning(s) in this server.`)
            .setTimestamp();

        // Add warning fields (max 25 fields)
        const maxWarnings = Math.min(guildWarnings.length, 25);
        for (let i = 0; i < maxWarnings; i++) {
            const warning = guildWarnings[i];
            const date = new Date(warning.timestamp).toLocaleDateString();
            
            embed.addFields({
                name: `Warning ${i + 1} (ID: ${warning.id})`,
                value: `**Reason:** ${warning.reason}\n**Moderator:** ${warning.moderator}\n**Date:** ${date}`,
                inline: true
            });
        }

        if (guildWarnings.length > 25) {
            embed.setFooter({ text: `Showing 25 of ${guildWarnings.length} warnings` });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async clearWarnings(interaction, user) {
        const userWarnings = warnings[user.id] || [];
        const guildWarnings = userWarnings.filter(w => w.guildId === interaction.guild.id);

        if (guildWarnings.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ No Warnings Found')
                .setDescription(`**${user.tag}** has no warnings in this server.`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Remove all warnings for this guild
        warnings[user.id] = userWarnings.filter(w => w.guildId !== interaction.guild.id);
        
        // Remove user entry if no warnings left
        if (warnings[user.id].length === 0) {
            delete warnings[user.id];
        }

        saveWarnings();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Warnings Cleared')
            .setDescription(`Cleared **${guildWarnings.length}** warning(s) for **${user.tag}**.`)
            .addFields(
                { name: 'Moderator', value: interaction.user.tag }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async removeWarning(interaction, user) {
        const warningId = interaction.options.getString('warning_id');
        const userWarnings = warnings[user.id] || [];
        const guildWarnings = userWarnings.filter(w => w.guildId === interaction.guild.id);

        // Find the warning to remove
        const warningIndex = userWarnings.findIndex(w => w.id === warningId && w.guildId === interaction.guild.id);

        if (warningIndex === -1) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Warning Not Found')
                .setDescription(`Warning with ID **${warningId}** not found for **${user.tag}** in this server.`)
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Remove the warning
        const removedWarning = userWarnings.splice(warningIndex, 1)[0];
        
        // Remove user entry if no warnings left
        if (warnings[user.id].length === 0) {
            delete warnings[user.id];
        }

        saveWarnings();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Warning Removed')
            .setDescription(`Removed warning for **${user.tag}**.`)
            .addFields(
                { name: 'Warning ID', value: warningId },
                { name: 'Reason', value: removedWarning.reason },
                { name: 'Original Moderator', value: removedWarning.moderator },
                { name: 'Removed By', value: interaction.user.tag }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
