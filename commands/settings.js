const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Simple in-memory Automod status (replace with DB or config file for persistence)
let automodEnabled = true;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('View or modify bot settings.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub.setName('automod')
                .setDescription('Manage Automod settings')
                .addStringOption(opt =>
                    opt.setName('action')
                        .setDescription('Enable, disable, or check status of Automod')
                        .setRequired(true)
                        .addChoices(
                            { name: 'enable', value: 'enable' },
                            { name: 'disable', value: 'disable' },
                            { name: 'status', value: 'status' }
                        )
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'automod') {
            const action = interaction.options.getString('action');
            let embed;
            if (action === 'enable') {
                automodEnabled = true;
                embed = new EmbedBuilder()
                    .setTitle('✅ Automod Enabled')
                    .setDescription('Automod is now enabled.')
                    .setColor(0x1fff00)
                    .setTimestamp();
            } else if (action === 'disable') {
                automodEnabled = false;
                embed = new EmbedBuilder()
                    .setTitle('❌ Automod Disabled')
                    .setDescription('Automod is now disabled.')
                    .setColor(0xff0000)
                    .setTimestamp();
            } else {
                embed = new EmbedBuilder()
                    .setTitle('⚙️ Automod Status')
                    .setDescription(`Automod is currently **${automodEnabled ? 'enabled' : 'disabled'}**.`)
                    .setColor(automodEnabled ? 0x1fff00 : 0xff0000)
                    .setTimestamp();
            }
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
